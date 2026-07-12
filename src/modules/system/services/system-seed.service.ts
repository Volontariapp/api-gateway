import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { JwtService } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';

import { WithMetadata } from '../../../common/types/grpc.types.js';

import {
  USER_PACKAGE,
  POST_PACKAGE,
  EVENT_PACKAGE,
  SOCIAL_PACKAGE,
} from '../../../grpc/grpc-packages.js';

import {
  USER_SERVICE_NAME,
  UserServiceClient,
  POST_SERVICE_NAME,
  PostServiceClient,
  EVENT_COMMAND_SERVICE_NAME,
  EventCommandServiceClient,
  INTERACTION_COMMAND_SERVICE_NAME,
  InteractionCommandServiceClient,
  PUBLICATION_COMMAND_SERVICE_NAME,
  PublicationCommandServiceClient,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  ParticipationCommandServiceClient,
} from '@volontariapp/contracts-nest';

export interface SeedStatusResponse {
  users: { success: number; failed: number };
  events: { success: number; failed: number };
  posts: { success: number; failed: number };
  comments: { success: number; failed: number };
  likes: { success: number; failed: number };
  participations: { success: number; failed: number };
}

@Injectable()
export class SystemSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: SystemSeedService.name });

  protected userService!: WithMetadata<UserServiceClient>;
  protected postService!: WithMetadata<PostServiceClient>;
  protected eventCommandService!: WithMetadata<EventCommandServiceClient>;
  protected interactionCommandService!: WithMetadata<InteractionCommandServiceClient>;
  protected publicationCommandService!: WithMetadata<PublicationCommandServiceClient>;
  protected participationCommandService!: WithMetadata<ParticipationCommandServiceClient>;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_PACKAGE) private userClient: ClientGrpc,
    @Inject(POST_PACKAGE) private postClient: ClientGrpc,
    @Inject(EVENT_PACKAGE) private eventClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private socialClient: ClientGrpc,
  ) {}

  private async getMetadataWithInternalToken(
    baseMetadata: Metadata,
    userId: string,
  ): Promise<Metadata> {
    const md = baseMetadata.clone();
    const token = await this.jwtService.signInternal({ id: userId, role: UserRoles.VOLUNTEER });
    md.add('x-internal-token', token);
    return md;
  }

  onModuleInit() {
    this.userService = this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
    this.postService = this.postClient.getService<PostServiceClient>(POST_SERVICE_NAME);
    this.eventCommandService = this.eventClient.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
    );
    this.interactionCommandService = this.socialClient.getService<InteractionCommandServiceClient>(
      INTERACTION_COMMAND_SERVICE_NAME,
    );
    this.publicationCommandService = this.socialClient.getService<PublicationCommandServiceClient>(
      PUBLICATION_COMMAND_SERVICE_NAME,
    );
    this.participationCommandService =
      this.socialClient.getService<ParticipationCommandServiceClient>(
        PARTICIPATION_COMMAND_SERVICE_NAME,
      );
  }

  seed(req: { headers?: Record<string, string | string[] | undefined> }): { message: string } {
    const rawHeaders = req.headers;
    const internalHeaders = rawHeaders?.['x-internal-metadata'];
    const userIdHeader = rawHeaders?.['x-user-id'];

    const baseMetadata = new Metadata();
    if (internalHeaders && typeof internalHeaders === 'string') {
      baseMetadata.add('internal-metadata', internalHeaders);
    }
    if (userIdHeader && typeof userIdHeader === 'string') {
      baseMetadata.add('user-id', userIdHeader);
    }

    // Launch background process
    this.runBackgroundSeed(baseMetadata).catch((err: unknown) => {
      this.logger.error('Background seed failed', err);
    });

    return {
      message:
        'Seeding process has been started in the background. Check backend logs for progress.',
    };
  }

  private async runBackgroundSeed(baseMetadata: Metadata) {
    this.logger.log('🚀 Starting global seeding process in background...');

    const status: SeedStatusResponse = {
      users: { success: 0, failed: 0 },
      events: { success: 0, failed: 0 },
      posts: { success: 0, failed: 0 },
      comments: { success: 0, failed: 0 },
      likes: { success: 0, failed: 0 },
      participations: { success: 0, failed: 0 },
    };

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      this.logger.log('Seeding Users...');
      const userIds = await this.seedUsers(200, baseMetadata, status);

      this.logger.log('Waiting 30s for Users to sync across graphs...');
      await delay(30000);

      this.logger.log('Seeding Events...');
      const eventIds = await this.seedEvents(userIds, 50, baseMetadata, status);

      this.logger.log('Waiting 30s for Events to sync across graphs...');
      await delay(30000);

      this.logger.log('Seeding Posts...');
      const postIds = await this.seedPosts(userIds, eventIds, 150, baseMetadata, status);

      this.logger.log('Waiting 30s for Posts to sync across graphs...');
      await delay(30000);

      this.logger.log('Seeding Interactions (Comments, Likes, Participations)...');
      await Promise.all([
        this.seedComments(userIds, postIds, 200, baseMetadata, status),
        this.seedLikes(userIds, postIds, 1500, baseMetadata, status),
        this.seedParticipations(userIds, eventIds, 1000, baseMetadata, status),
      ]);

      this.logger.log(`✅ Global seeding completed! Final Status: ${JSON.stringify(status)}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`💥 Fatal error during background seeding: ${msg}`);
    }
  }

  private async seedUsers(
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ): Promise<string[]> {
    const userIds: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const email = faker.internet.email();
        const pseudo = faker.internet.username();
        const password = 'Password123!';

        const res = await lastValueFrom(
          this.userService.signUp({ email, pseudo, password }, baseMetadata),
        );
        if (res.user?.id) {
          userIds.push(res.user.id);
          status.users.success++;
        } else {
          status.users.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed user ${String(i)}: ${msg}`);
        status.users.failed++;
      }
    }
    return userIds;
  }

  private async seedEvents(
    userIds: string[],
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ): Promise<string[]> {
    const eventIds: string[] = [];
    if (userIds.length === 0) return eventIds;
    for (let i = 0; i < count; i++) {
      try {
        const isEcology = faker.datatype.boolean();
        const ECOLOGY_TITLES = [
          'Collecte de déchets au parc',
          'Nettoyage de la plage',
          "Plantation d'arbres",
          'Sensibilisation au tri',
          'Atelier recyclage',
          'Nettoyage de la forêt',
          'Marche verte',
          'Jardinage communautaire',
        ];
        const SOCIAL_TITLES = [
          'Maraude solidaire',
          'Distribution de repas',
          'Soutien scolaire',
          'Aide aux personnes âgées',
          'Collecte de vêtements',
          'Atelier de réinsertion',
          'Accueil de jour',
          'Animation EHPAD',
        ];

        const title = isEcology
          ? faker.helpers.arrayElement(ECOLOGY_TITLES)
          : faker.helpers.arrayElement(SOCIAL_TITLES);
        const description = `${title} organisé dans le cadre de nos actions. Nous avons besoin de votre aide pour rendre le monde meilleur ! ${faker.lorem.paragraph()}`;
        const eventType = isEcology ? 2 : 1; // 2 = ECOLOGY, 1 = SOCIAL

        const startAt = {
          seconds: Math.floor(Date.now() / 1000) + faker.number.int({ min: 86400, max: 2592000 }),
          nanos: 0,
        };
        const endAt = {
          seconds: startAt.seconds + faker.number.int({ min: 3600, max: 86400 }),
          nanos: 0,
        };
        const ownerId = faker.helpers.arrayElement(userIds);

        const md = await this.getMetadataWithInternalToken(baseMetadata, ownerId);

        const PARIS_LOCATIONS = [
          'Paris 1er',
          'Paris 10e',
          'Paris 18e',
          'Paris 15e',
          'Montreuil',
          'Boulogne-Billancourt',
          'Vincennes',
          'Saint-Denis',
          'Ivry-sur-Seine',
          'Levallois-Perret',
          'Pantin',
          'Issy-les-Moulineaux',
        ];

        const res = await lastValueFrom(
          this.eventCommandService.createEvent(
            {
              title,
              description,
              localisationName: faker.helpers.arrayElement(PARIS_LOCATIONS),
              startAt,
              endAt,
              type: eventType,
              maxParticipants: faker.number.int({ min: 10, max: 100 }),
              awardedImpactScore: faker.number.int({ min: 5, max: 50 }),
              tagIds: [],
            },
            md,
          ),
        );

        if (res.event?.id) {
          const eventId = res.event.id;
          eventIds.push(eventId);
          status.events.success++;

          try {
            await lastValueFrom(this.participationCommandService.createEventNode({ eventId }, md));
            await lastValueFrom(
              this.participationCommandService.postUserEvent({ userId: ownerId, eventId }, md),
            );
          } catch {
            // ignore social node creation failures
          }
        } else {
          status.events.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed event ${String(i)}: ${msg}`);
        status.events.failed++;
      }
    }
    return eventIds;
  }

  private async seedPosts(
    userIds: string[],
    eventIds: string[],
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ): Promise<string[]> {
    const postIds: string[] = [];
    if (userIds.length === 0) return postIds;
    for (let i = 0; i < count; i++) {
      try {
        const authorId = faker.helpers.arrayElement(userIds);
        const relatedEventId =
          eventIds.length > 0
            ? faker.helpers.maybe(() => faker.helpers.arrayElement(eventIds), { probability: 0.5 })
            : undefined;

        const md = await this.getMetadataWithInternalToken(baseMetadata, authorId);

        const POST_CONTENTS = [
          "Super initiative ! J'ai adoré participer.",
          'Bravo à tous pour cette action.',
          'Une belle journée de solidarité.',
          'Merci aux organisateurs.',
          "On a fait du bon boulot ! C'était fatiguant mais très utile.",
          "Voici quelques photos de notre action d'aujourd'hui !",
          'Qui est chaud pour la prochaine édition ?',
        ];

        const res = await lastValueFrom(
          this.postService.createPost(
            {
              title: faker.lorem.sentence(),
              content: faker.helpers.arrayElement(POST_CONTENTS) + ' ' + faker.lorem.sentence(),
              eventId: relatedEventId,
            },
            md,
          ),
        );

        if (res.post?.id) {
          const postId = res.post.id;
          postIds.push(postId);
          status.posts.success++;

          try {
            await lastValueFrom(this.publicationCommandService.createPostNode({ postId }, md));
            await lastValueFrom(this.publicationCommandService.postUserOwn({ postId }, md));
          } catch {
            // ignore social node creation failures
          }
        } else {
          status.posts.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed post ${String(i)}: ${msg}`);
        status.posts.failed++;
      }
    }
    return postIds;
  }

  private async seedComments(
    userIds: string[],
    postIds: string[],
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ) {
    if (postIds.length === 0 || userIds.length === 0) return;
    for (let i = 0; i < count; i++) {
      try {
        const authorId = faker.helpers.arrayElement(userIds);
        const postId = faker.helpers.arrayElement(postIds);

        const md = await this.getMetadataWithInternalToken(baseMetadata, authorId);

        const res = await lastValueFrom(
          this.postService.createComment(
            {
              content: faker.lorem.sentence(),
              postId: postId,
            },
            md,
          ),
        );

        if (res.comment?.id) {
          status.comments.success++;
        } else {
          status.comments.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed comment ${String(i)}: ${msg}`);
        status.comments.failed++;
      }
    }
  }

  private async seedLikes(
    userIds: string[],
    postIds: string[],
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ) {
    if (postIds.length === 0 || userIds.length === 0) return;
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      try {
        let userId, postId, key;
        let attempts = 0;
        do {
          userId = faker.helpers.arrayElement(userIds);
          postId = faker.helpers.arrayElement(postIds);
          key = `${userId}-${postId}`;
          attempts++;
        } while (seen.has(key) && attempts < 100);

        if (attempts >= 100) break;
        seen.add(key);

        const md = await this.getMetadataWithInternalToken(baseMetadata, userId);

        await lastValueFrom(
          this.interactionCommandService.postLikePost(
            {
              postId: postId,
            },
            md,
          ),
        );
        status.likes.success++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed like ${String(i)}: ${msg}`);
        status.likes.failed++;
      }
    }
  }

  private async seedParticipations(
    userIds: string[],
    eventIds: string[],
    count: number,
    baseMetadata: Metadata,
    status: SeedStatusResponse,
  ) {
    if (eventIds.length === 0 || userIds.length === 0) return;
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      try {
        let userId, eventId, key;
        let attempts = 0;
        do {
          userId = faker.helpers.arrayElement(userIds);
          eventId = faker.helpers.arrayElement(eventIds);
          key = `${userId}-${eventId}`;
          attempts++;
        } while (seen.has(key) && attempts < 100);

        if (attempts >= 100) break;
        seen.add(key);

        const md = await this.getMetadataWithInternalToken(baseMetadata, userId);

        await lastValueFrom(
          this.participationCommandService.postUserParticipateEvent(
            {
              eventId: eventId,
            },
            md,
          ),
        );
        status.participations.success++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Failed to seed participation ${String(i)}: ${msg}`);
        status.participations.failed++;
      }
    }
  }
}

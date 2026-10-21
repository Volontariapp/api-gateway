import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  PARTICIPATION_COMMAND_SERVICE_NAME,
  type ParticipationCommandServiceClient,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  type RelationshipCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import type { SeedStatusResponseDTO } from '../common/index.js';

@Injectable()
export class InteractionSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: InteractionSeedService.name });
  private participationService!: WithMetadata<ParticipationCommandServiceClient>;
  private relationshipService!: WithMetadata<RelationshipCommandServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc) {}

  onModuleInit() {
    this.participationService = this.socialClient.getService<ParticipationCommandServiceClient>(
      PARTICIPATION_COMMAND_SERVICE_NAME,
    );
    this.relationshipService = this.socialClient.getService<RelationshipCommandServiceClient>(
      RELATIONSHIP_COMMAND_SERVICE_NAME,
    );
  }

  /**
   * Seed complet des interactions :
   * 1. Participations Passées (vitales pour alimenter l'historique de ranking / Jev)
   * 2. Participations Futures
   * 3. Wishes sur les événements futurs
   * 4. Follows entre utilisateurs pour tisser le graphe social
   */
  async seedInteractions(
    userIds: string[],
    goldenUserIds: Map<string, string>,
    pastEventIds: string[],
    futureEventIds: string[],
    eventCategoryMap: Map<string, string>,
    concurrency: number,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedStatusResponseDTO,
  ): Promise<void> {
    this.logger.log('🤝 Seeding all social interactions (participations, wishes, follows)...');

    const ecoVolunteerId = goldenUserIds.get('ecology');
    const socialVolunteerId = goldenUserIds.get('social');

    // 1. Participations aux événements passés (Alimente le goût passé de l'utilisateur pour le ranking)
    this.logger.log(
      `⏳ Seeding past event participations for ${String(pastEventIds.length)} past events...`,
    );
    const pastParticipationPairs: Array<{ userId: string; eventId: string }> = [];

    for (const eventId of pastEventIds) {
      const category = eventCategoryMap.get(eventId);

      // Le bénévole écolo participe activement aux événements écologiques passés
      if (
        ecoVolunteerId &&
        (category === 'ecology' || category === 'garden' || category === 'cycling')
      ) {
        pastParticipationPairs.push({ userId: ecoVolunteerId, eventId });
      }

      // Le bénévole social participe activement aux maraudes et solidarité passées
      if (
        socialVolunteerId &&
        (category === 'solidarity' || category === 'education' || category === 'seniors')
      ) {
        pastParticipationPairs.push({ userId: socialVolunteerId, eventId });
      }

      // 5 à 25 participants aléatoires par événement passé
      const count = faker.number.int({ min: 5, max: 25 });
      const attendees = faker.helpers.arrayElements(userIds, Math.min(count, userIds.length));
      for (const uId of attendees) {
        pastParticipationPairs.push({ userId: uId, eventId });
      }
    }

    // Déduplication des paires
    const uniquePast = Array.from(
      new Set(pastParticipationPairs.map((p) => `${p.userId}:${p.eventId}`)),
    ).map((key) => {
      const [userId, eventId] = key.split(':');
      return { userId, eventId };
    });

    await this.runChunked(
      uniquePast,
      concurrency,
      async (pair) => {
        try {
          const md = await getMetadata(baseMetadata, pair.userId);
          await lastValueFrom(
            this.participationService.postUserParticipateEvent({ eventId: pair.eventId }, md),
          );
          status.participations.success++;
        } catch {
          status.participations.failed++;
        }
      },
      'Past participations',
    );

    // 2. Participations aux événements futurs (Inscriptions à venir)
    this.logger.log(
      `📅 Seeding future registrations for ${String(futureEventIds.length)} future events...`,
    );
    const futureParticipationPairs: Array<{ userId: string; eventId: string }> = [];
    for (const eventId of futureEventIds) {
      const count = faker.number.int({ min: 3, max: 15 });
      const attendees = faker.helpers.arrayElements(userIds, Math.min(count, userIds.length));
      for (const uId of attendees) {
        futureParticipationPairs.push({ userId: uId, eventId });
      }
    }

    const uniqueFuture = Array.from(
      new Set(futureParticipationPairs.map((p) => `${p.userId}:${p.eventId}`)),
    ).map((key) => {
      const [userId, eventId] = key.split(':');
      return { userId, eventId };
    });

    await this.runChunked(
      uniqueFuture,
      concurrency,
      async (pair) => {
        try {
          const md = await getMetadata(baseMetadata, pair.userId);
          await lastValueFrom(
            this.participationService.postUserParticipateEvent({ eventId: pair.eventId }, md),
          );
          status.participations.success++;
        } catch {
          status.participations.failed++;
        }
      },
      'Future participations',
    );

    // 3. Wishes (Favoris sur les événements futurs)
    this.logger.log(`✨ Seeding wishes on future events...`);
    const wishPairs: Array<{ userId: string; eventId: string }> = [];
    for (const eventId of futureEventIds) {
      if (Math.random() < 0.7) {
        const count = faker.number.int({ min: 2, max: 12 });
        const wishers = faker.helpers.arrayElements(userIds, Math.min(count, userIds.length));
        for (const uId of wishers) {
          wishPairs.push({ userId: uId, eventId });
        }
      }
    }

    const uniqueWishes = Array.from(new Set(wishPairs.map((p) => `${p.userId}:${p.eventId}`))).map(
      (key) => {
        const [userId, eventId] = key.split(':');
        return { userId, eventId };
      },
    );

    await this.runChunked(
      uniqueWishes,
      concurrency,
      async (pair) => {
        try {
          const md = await getMetadata(baseMetadata, pair.userId);
          await lastValueFrom(
            this.participationService.postUserWishEvent({ eventId: pair.eventId }, md),
          );
          status.wishes.success++;
        } catch {
          status.wishes.failed++;
        }
      },
      'Wishes',
    );

    // 4. Follows (Réseau social d'abonnements)
    this.logger.log(`👥 Seeding social graph follows...`);
    const followPairs: Array<{ followerId: string; followedId: string }> = [];

    // Faire suivre les Golden Users par un ensemble de personnes
    for (const goldenId of goldenUserIds.values()) {
      const followers = faker.helpers.arrayElements(
        userIds.filter((id) => id !== goldenId),
        Math.min(30, userIds.length),
      );
      for (const followerId of followers) {
        followPairs.push({ followerId, followedId: goldenId });
      }
    }

    // Connexions aléatoires entre utilisateurs
    for (const uId of userIds.slice(0, Math.min(200, userIds.length))) {
      const toFollow = faker.helpers.arrayElements(
        userIds.filter((id) => id !== uId),
        faker.number.int({ min: 2, max: 8 }),
      );
      for (const followedId of toFollow) {
        followPairs.push({ followerId: uId, followedId });
      }
    }

    const uniqueFollows = Array.from(
      new Set(followPairs.map((p) => `${p.followerId}:${p.followedId}`)),
    ).map((key) => {
      const [followerId, followedId] = key.split(':');
      return { followerId, followedId };
    });

    await this.runChunked(
      uniqueFollows,
      concurrency,
      async (pair) => {
        try {
          const md = await getMetadata(baseMetadata, pair.followerId);
          await lastValueFrom(
            this.relationshipService.postFollowUser({ followedId: pair.followedId }, md),
          );
          status.follows.success++;
        } catch {
          status.follows.failed++;
        }
      },
      'Follows',
    );

    this.logger.log(`✅ Interactions seed completed!`);
  }

  private async runChunked<T>(
    items: T[],
    chunkSize: number,
    processor: (item: T) => Promise<void>,
    label: string,
  ): Promise<void> {
    let index = 0;
    while (index < items.length) {
      const batch = items.slice(index, index + chunkSize);
      await Promise.all(batch.map((item) => processor(item)));
      index += chunkSize;
    }
    this.logger.log(`Processed ${String(items.length)} ${label}.`);
  }
}

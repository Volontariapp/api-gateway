import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  EVENT_COMMAND_SERVICE_NAME,
  type EventCommandServiceClient,
  EventState,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  type ParticipationCommandServiceClient,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  type RelationshipCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import type { SeedStatusResponseDTO } from '../common/index.js';
import {
  type AttendanceScenario,
  allocateAttendanceScenario,
  chunkIds,
  computePresentCount,
  selectPresentUserIds,
} from '../constants/seed-attendance-scenarios.constant.js';

/** Inscriptions prevues pour un evenement, dans l'ordre d'inscription. */
export interface EventRegistrationPlan {
  eventId: string;
  /** Rang de l'evenement dans sa liste (passee ou future), sert a la repartition deterministe. */
  position: number;
  userIds: string[];
}

@Injectable()
export class InteractionSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: InteractionSeedService.name });
  private participationService!: WithMetadata<ParticipationCommandServiceClient>;
  private relationshipService!: WithMetadata<RelationshipCommandServiceClient>;
  private eventCommandService!: WithMetadata<EventCommandServiceClient>;

  constructor(
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.participationService = this.socialClient.getService<ParticipationCommandServiceClient>(
      PARTICIPATION_COMMAND_SERVICE_NAME,
    );
    this.relationshipService = this.socialClient.getService<RelationshipCommandServiceClient>(
      RELATIONSHIP_COMMAND_SERVICE_NAME,
    );
    this.eventCommandService = this.eventClient.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
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
    eventOwnerMap: Map<string, string>,
    eventCapacityMap: Map<string, number>,
    concurrency: number,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedStatusResponseDTO,
  ): Promise<void> {
    this.logger.log('🤝 Seeding all social interactions (participations, wishes, follows)...');

    const ecoVolunteerId = goldenUserIds.get('ecology');
    const socialVolunteerId = goldenUserIds.get('social');

    // 1. Inscriptions, presences et cloture des evenements passes (alimente historique, ranking et points)
    this.logger.log(
      `⏳ Seeding past event participations for ${String(pastEventIds.length)} past events...`,
    );
    const pastPlans: EventRegistrationPlan[] = pastEventIds.map((eventId, position) => {
      const extraUserIds: string[] = [];
      const category = eventCategoryMap.get(eventId);

      // Le bénévole écolo participe activement aux événements écologiques passés
      if (
        ecoVolunteerId &&
        (category === 'ecology' || category === 'garden' || category === 'cycling')
      ) {
        extraUserIds.push(ecoVolunteerId);
      }

      // Le bénévole social participe activement aux maraudes et solidarité passées
      if (
        socialVolunteerId &&
        (category === 'solidarity' || category === 'education' || category === 'seniors')
      ) {
        extraUserIds.push(socialVolunteerId);
      }

      // 5 à 25 participants aléatoires par événement passé
      const count = faker.number.int({ min: 5, max: 25 });
      return this.buildRegistrationPlan(
        eventId,
        position,
        userIds,
        count,
        extraUserIds,
        eventOwnerMap,
        eventCapacityMap,
      );
    });

    const scenarioTally = new Map<AttendanceScenario, number>();
    await this.runChunked(
      pastPlans,
      concurrency,
      async (plan) => {
        const registered = await this.registerSequentially(plan, getMetadata, baseMetadata, status);
        const scenario = allocateAttendanceScenario(plan.position);
        scenarioTally.set(scenario, (scenarioTally.get(scenario) ?? 0) + 1);
        await this.closePastEvent(
          plan,
          scenario,
          registered,
          eventOwnerMap,
          getMetadata,
          baseMetadata,
          status,
        );
      },
      'Past events (registrations, attendance, closing)',
    );
    this.logger.log(
      `Past event scenarios: ${Array.from(scenarioTally.entries())
        .map(([scenario, total]) => `${scenario}=${String(total)}`)
        .join(', ')}.`,
    );

    // 2. Participations aux événements futurs (Inscriptions à venir, sans présence ni changement d'état)
    this.logger.log(
      `📅 Seeding future registrations for ${String(futureEventIds.length)} future events...`,
    );
    const futurePlans: EventRegistrationPlan[] = futureEventIds.map((eventId, position) =>
      this.buildRegistrationPlan(
        eventId,
        position,
        userIds,
        faker.number.int({ min: 3, max: 15 }),
        [],
        eventOwnerMap,
        eventCapacityMap,
      ),
    );

    await this.runChunked(
      futurePlans,
      concurrency,
      async (plan) => {
        await this.registerSequentially(plan, getMetadata, baseMetadata, status);
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

  /**
   * Construit la liste ordonnee des inscrits d'un evenement : sans l'organisateur, sans doublon,
   * limitee a la capacite de l'evenement. Les profils imposes passent en premier.
   */
  buildRegistrationPlan(
    eventId: string,
    position: number,
    candidateUserIds: string[],
    desiredCount: number,
    priorityUserIds: string[],
    eventOwnerMap: Map<string, string>,
    eventCapacityMap: Map<string, number>,
  ): EventRegistrationPlan {
    const ownerId = eventOwnerMap.get(eventId);
    const capacity = Math.max(1, eventCapacityMap.get(eventId) ?? 1);
    const eligible = candidateUserIds.filter((id) => id !== ownerId);
    const randomUserIds = faker.helpers.arrayElements(
      eligible,
      Math.min(desiredCount, eligible.length),
    );
    const ordered = [...priorityUserIds.filter((id) => id !== ownerId), ...randomUserIds];
    const unique = Array.from(new Set(ordered)).slice(0, capacity);
    return { eventId, position, userIds: unique };
  }

  /** Inscrit les utilisateurs un par un (ordre d'inscription stable) et renvoie ceux inscrits. */
  private async registerSequentially(
    plan: EventRegistrationPlan,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedStatusResponseDTO,
  ): Promise<string[]> {
    const registered: string[] = [];
    for (const userId of plan.userIds) {
      try {
        const md = await getMetadata(baseMetadata, userId);
        await lastValueFrom(
          this.participationService.postUserParticipateEvent({ eventId: plan.eventId }, md),
        );
        status.participations.success++;
        registered.push(userId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.debug(
          `Registration failed for user ${userId} on event ${plan.eventId}: ${msg}`,
        );
        status.participations.failed++;
      }
    }
    return registered;
  }

  /**
   * Cloture un evenement passe selon son scenario : presences cochees par l'organisateur puis
   * FINISHED, ou CANCELLED. Appele une fois toutes les inscriptions de l'evenement terminees.
   */
  async closePastEvent(
    plan: EventRegistrationPlan,
    scenario: AttendanceScenario,
    registeredUserIds: string[],
    eventOwnerMap: Map<string, string>,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedStatusResponseDTO,
  ): Promise<void> {
    const ownerId = eventOwnerMap.get(plan.eventId);
    if (!ownerId) {
      this.logger.debug(`No organizer known for event ${plan.eventId}, lifecycle skipped.`);
      return;
    }

    try {
      const ownerMd = await getMetadata(baseMetadata, ownerId);

      if (scenario === 'cancelled') {
        await lastValueFrom(
          this.eventCommandService.changeEventState(
            { id: plan.eventId, newState: EventState.EVENT_STATE_CANCELLED },
            ownerMd,
          ),
        );
        status.cancelledEvents.success++;
        return;
      }

      const presentCount = computePresentCount(scenario, registeredUserIds.length, plan.position);
      const presentUserIds = selectPresentUserIds(registeredUserIds, presentCount, plan.position);

      let checkInFailed = false;
      for (const batch of chunkIds(presentUserIds)) {
        try {
          await lastValueFrom(
            this.participationService.setEventAttendance(
              { eventId: plan.eventId, checkedUserIds: batch, uncheckedUserIds: [] },
              ownerMd,
            ),
          );
          status.attendances.success += batch.length;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.debug(`Check-in failed for event ${plan.eventId}: ${msg}`);
          status.attendances.failed += batch.length;
          checkInFailed = true;
        }
      }

      if (checkInFailed) {
        // Terminer l'evenement avec une presence partielle fausserait les points : on le laisse ouvert.
        this.logger.debug(`Event ${plan.eventId} left unfinished after a failed check-in.`);
        return;
      }

      await lastValueFrom(
        this.eventCommandService.changeEventState(
          { id: plan.eventId, newState: EventState.EVENT_STATE_FINISHED },
          ownerMd,
        ),
      );
      status.finishedEvents.success++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.debug(`Failed to close event ${plan.eventId} (${scenario}): ${msg}`);
      if (scenario === 'cancelled') {
        status.cancelledEvents.failed++;
      } else {
        status.finishedEvents.failed++;
      }
    }
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

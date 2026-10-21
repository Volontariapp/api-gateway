import { randomUUID } from 'node:crypto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  EVENT_COMMAND_SERVICE_NAME,
  type EventCommandServiceClient,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  type ParticipationCommandServiceClient,
  EventType,
  EntityType,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { ILE_DE_FRANCE_LOCATIONS } from '../constants/seed-locations.constant.js';
import { THEMATIC_EVENT_TEMPLATES } from '../constants/seed-templates.constant.js';
import { MediaSeedService } from './media-seed.service.js';
import type { SeedCountStatsDTO } from '../common/index.js';

export interface SeededEventsResult {
  pastEventIds: string[];
  futureEventIds: string[];
  allEventIds: string[];
  eventCategoryMap: Map<string, string>; // eventId -> category
}

@Injectable()
export class EventSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: EventSeedService.name });
  private eventCommandService!: WithMetadata<EventCommandServiceClient>;
  private participationCommandService!: WithMetadata<ParticipationCommandServiceClient>;

  constructor(
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    private readonly mediaSeedService: MediaSeedService,
  ) {}

  onModuleInit() {
    this.eventCommandService = this.eventClient.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
    );
    this.participationCommandService =
      this.socialClient.getService<ParticipationCommandServiceClient>(
        PARTICIPATION_COMMAND_SERVICE_NAME,
      );
  }

  /**
   * Crée des événements passés (-90j à -1j) et futurs (+1j à +180j) répartis en Île-de-France.
   */
  async seedEvents(
    userIds: string[],
    goldenUserIds: Map<string, string>,
    tagMap: Map<string, string>,
    targetCount: number,
    concurrency: number,
    seedMedia: boolean,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedCountStatsDTO,
  ): Promise<SeededEventsResult> {
    this.logger.log(
      `Seeding events (Target: ${String(targetCount)}, 40% Past / 60% Future over 6 months)...`,
    );

    const pastEventIds: string[] = [];
    const futureEventIds: string[] = [];
    const allEventIds: string[] = [];
    const eventCategoryMap = new Map<string, string>();

    const pastCount = Math.floor(targetCount * 0.4);
    const futureCount = targetCount - pastCount;

    const organizerId = goldenUserIds.get('organizer') ?? userIds[0];

    const createSingleEvent = async (isPast: boolean, index: number) => {
      try {
        const template = faker.helpers.arrayElement(THEMATIC_EVENT_TEMPLATES);
        const location = faker.helpers.arrayElement(ILE_DE_FRANCE_LOCATIONS);
        const titlePrefix = faker.helpers.arrayElement(template.titles);
        const title = `${titlePrefix} - ${location.city}`;
        const description = `${faker.helpers.arrayElement(template.descriptions)} Rendez-vous à ${location.name} (${location.address}, ${location.postalCode} ${location.city}).`;

        // Calcul des dates passées ou futures
        const nowSec = Math.floor(Date.now() / 1000);
        let startSec: number;
        if (isPast) {
          // Passé : entre il y a 90 jours et il y a 1 jour
          const daysAgoSec = faker.number.int({ min: 86400, max: 90 * 86400 });
          startSec = nowSec - daysAgoSec;
        } else {
          // Futur : entre +1 jour et +180 jours (6 mois)
          const daysFutureSec = faker.number.int({ min: 86400, max: 180 * 86400 });
          startSec = nowSec + daysFutureSec;
        }
        const durationSec = faker.number.int({ min: 7200, max: 18000 }); // 2h à 5h
        const endSec = startSec + durationSec;

        const eventType =
          template.category === 'ecology' ||
          template.category === 'garden' ||
          template.category === 'cycling'
            ? EventType.EVENT_TYPE_ECOLOGY
            : EventType.EVENT_TYPE_SOCIAL;

        // Tags associés
        const tagIds = template.tagSlugs
          .map((slug) => tagMap.get(slug))
          .filter((id): id is string => Boolean(id));

        const ownerId = Math.random() < 0.4 ? organizerId : faker.helpers.arrayElement(userIds);
        const ownerMd = await getMetadata(baseMetadata, ownerId);

        // Upload d'image unique si activé
        const tempEntityId = randomUUID();
        let coverFileId: string | undefined;
        if (seedMedia) {
          coverFileId = await this.mediaSeedService.getOrUploadImage(
            tempEntityId,
            EntityType.ENTITY_TYPE_EVENT_COVER,
            template.imageTheme,
            ownerMd,
          );
        }

        const res = await lastValueFrom(
          this.eventCommandService.createEvent(
            {
              title,
              description,
              localisationName: `${location.name}, ${location.postalCode} ${location.city}`,
              startAt: { seconds: startSec, nanos: 0 },
              endAt: { seconds: endSec, nanos: 0 },
              type: eventType,
              maxParticipants: faker.number.int({ min: 10, max: 80 }),
              awardedImpactScore: faker.number.int({ min: 15, max: 60 }),
              tagIds,
              coverFileId,
              idempotencyKey: randomUUID(),
            },
            ownerMd,
          ),
        );

        if (res.event?.id) {
          const eventId = res.event.id;
          allEventIds.push(eventId);
          eventCategoryMap.set(eventId, template.category);

          if (isPast) {
            pastEventIds.push(eventId);
          } else {
            futureEventIds.push(eventId);
          }
          status.success++;

          // Synchronisation du nœud d'événement et du lien d'organisation dans ms-social
          try {
            await lastValueFrom(
              this.participationCommandService.createEventNode({ eventId }, ownerMd),
            );
            await lastValueFrom(
              this.participationCommandService.postUserEvent({ userId: ownerId, eventId }, ownerMd),
            );
          } catch {
            // Ignorer si déjà existant
          }

          // Ajout de prérequis
          if (template.requirements.length > 0 && Math.random() < 0.6) {
            const reqName = faker.helpers.arrayElement(template.requirements);
            try {
              await lastValueFrom(
                this.eventCommandService.manageRequirements(
                  {
                    eventId,
                    add: {
                      name: reqName,
                      description: `Prérequis : ${reqName}`,
                      neededQuantity: faker.number.int({ min: 5, max: 20 }),
                    },
                  },
                  ownerMd,
                ),
              );
            } catch {
              // Ignorer les erreurs d'ajout de prérequis
            }
          }
        } else {
          status.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.debug(`Failed to seed event ${String(index)}: ${msg}`);
        status.failed++;
      }
    };

    // Traitement par lots des événements passés puis futurs
    const runBatch = async (items: boolean[]) => {
      let i = 0;
      while (i < items.length) {
        const batch = items.slice(i, i + concurrency);
        await Promise.all(batch.map((isPast, idx) => createSingleEvent(isPast, i + idx)));
        i += concurrency;
        if (allEventIds.length % 50 === 0 || allEventIds.length === targetCount) {
          this.logger.log(
            `Events progress: ${String(allEventIds.length)}/${String(targetCount)} created.`,
          );
        }
      }
    };

    const pastList = Array.from({ length: pastCount }).map(() => true);
    const futureList = Array.from({ length: futureCount }).map(() => false);

    await runBatch(pastList);
    await runBatch(futureList);

    this.logger.log(
      `Events seed complete: ${String(allEventIds.length)} events (${String(pastEventIds.length)} past, ${String(futureEventIds.length)} future).`,
    );

    return { pastEventIds, futureEventIds, allEventIds, eventCategoryMap };
  }
}

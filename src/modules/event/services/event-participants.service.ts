import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { TtlLruCache } from '../../../common/cache/ttl-lru-cache.js';
import { CacheStatsReporter } from '../../../common/cache/cache-stats.reporter.js';
import type { EventDTO } from '../dto/common/event.dto.js';

/** Plafond de ids par appel countEventParticipants (aligne sur ms-social). */
export const COUNT_BATCH_SIZE = 100;

/** Counts kept per gateway pod: under 1 MB for 5000 entries. */
export const PARTICIPANT_COUNT_CACHE_SIZE = 5_000;

/** A list can show a count up to 30 s old on each pod. */
export const PARTICIPANT_COUNT_TTL_MS = 30_000;

/**
 * Fills `currentParticipants` from ms-social: ms-event does not count participants. A failure
 * leaves the value received from ms-event and is only logged, so a list is never lost for it.
 *
 * Lists (`enrichAll`) read the counts from a per-process cache and only ask ms-social for the ids
 * it does not hold. The detail of one event (`enrich`) always asks ms-social, so the user who just
 * joined sees the new count, and refreshes the cached entry. countEventParticipants takes no user
 * input, so a count is the same for every caller.
 */
@Injectable()
export class EventParticipantsService implements OnModuleInit {
  private readonly logger = new Logger({ context: EventParticipantsService.name });
  private readonly counts = new TtlLruCache<number>(
    PARTICIPANT_COUNT_CACHE_SIZE,
    PARTICIPANT_COUNT_TTL_MS,
    undefined,
    'event-participant-counts',
  );
  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    @Optional() cacheStats?: CacheStatsReporter,
  ) {
    cacheStats?.register(this.counts);
  }

  onModuleInit() {
    this.participationQueryService = this.socialClient.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  async enrich(event: EventDTO, metadata: Metadata): Promise<void> {
    await this.fill([event], metadata, false);
  }

  /** Un appel par lot de 100 ids absents du cache (ids dedoublonnes). */
  async enrichAll(events: readonly EventDTO[], metadata: Metadata): Promise<void> {
    await this.fill(events, metadata, true);
  }

  private async fill(
    events: readonly EventDTO[],
    metadata: Metadata,
    readCache: boolean,
  ): Promise<void> {
    const ids = [...new Set(events.map((event) => event.id))];
    const counts = new Map<string, number>();
    const missing: string[] = [];
    for (const id of ids) {
      const cached = readCache ? this.counts.get(id) : undefined;
      if (cached === undefined) {
        missing.push(id);
      } else {
        counts.set(id, cached);
      }
    }
    const fetched = await this.fetchCounts(missing, metadata);
    for (const [id, count] of fetched) {
      counts.set(id, count);
      this.counts.set(id, count);
    }
    for (const event of events) {
      const count = counts.get(event.id);
      // +1 : le createur est un participant implicite, non compte par ms-social
      if (count !== undefined) {
        event.currentParticipants = count + 1;
      }
    }
  }

  /** Only the batches that succeeded end up in the result, so a failure is never cached. */
  private async fetchCounts(
    ids: readonly string[],
    metadata: Metadata,
  ): Promise<Map<string, number>> {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += COUNT_BATCH_SIZE) {
      chunks.push(ids.slice(i, i + COUNT_BATCH_SIZE));
    }
    const counts = new Map<string, number>();
    await Promise.all(
      chunks.map(async (eventIds) => {
        try {
          const response = await firstValueFrom(
            this.participationQueryService.countEventParticipants({ eventIds }, metadata),
          );
          for (const { eventId, participantCount } of response.counts) {
            counts.set(eventId, participantCount);
          }
        } catch {
          this.logger.warn(
            `Failed to count participants for ${String(eventIds.length)} events (first: ${eventIds[0]})`,
          );
        }
      }),
    );
    return counts;
  }
}

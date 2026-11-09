import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
  type Event,
  type GetEventsByIdsResponse,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { TtlLruCache } from '../../../common/cache/ttl-lru-cache.js';
import { PublicFileUrlService } from '../../storage/public-file-url.service.js';
import { EventDTO } from '../dto/common/event.dto.js';

/** Events kept per gateway pod: 1 to 3 MB at 2 to 5 KB each. */
export const EVENT_LOOKUP_CACHE_SIZE = 500;

/** An event shown next to a post can be up to 30 s old on each pod. */
export const EVENT_LOOKUP_TTL_MS = 30_000;

/**
 * Reads events by id for the lists that only show them (posts list). ms-event getEventsByIds only
 * uses the caller in a log line, so an event is the same for every caller and is cached per id.
 * Only the ids missing from the cache are asked for. An id that ms-event does not return stays
 * missing and is not cached; a failed call is logged, returns the cached events only and caches
 * nothing.
 */
@Injectable()
export class EventLookupService implements OnModuleInit {
  private readonly logger = new Logger({ context: EventLookupService.name });
  private readonly events = new TtlLruCache<Event>(EVENT_LOOKUP_CACHE_SIZE, EVENT_LOOKUP_TTL_MS);
  private eventQueryService!: WithMetadata<EventQueryServiceClient>;

  constructor(
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
    private readonly publicFileUrls: PublicFileUrlService,
  ) {}

  onModuleInit() {
    this.eventQueryService =
      this.eventClient.getService<EventQueryServiceClient>(EVENT_QUERY_SERVICE_NAME);
  }

  /** Found events keyed by id, in the order of the first occurrence of each id in `ids`. */
  async getByIds(ids: readonly string[], metadata: Metadata): Promise<Map<string, EventDTO>> {
    const unique = [...new Set(ids)];
    const found = new Map<string, Event>();
    const missing: string[] = [];
    for (const id of unique) {
      const cached = this.events.get(id);
      if (cached === undefined) {
        missing.push(id);
      } else {
        found.set(id, cached);
      }
    }

    if (missing.length > 0) {
      try {
        const response = await firstValueFrom<GetEventsByIdsResponse>(
          this.eventQueryService.getEventsByIds({ ids: missing }, metadata),
        );
        for (const event of response.events) {
          found.set(event.id, event);
          this.events.set(event.id, event);
        }
      } catch (err) {
        this.logger.error(
          `Failed to fetch ${String(missing.length)} events by ids`,
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }

    const result = new Map<string, EventDTO>();
    for (const id of unique) {
      const event = found.get(id);
      if (event !== undefined) {
        result.set(id, EventDTO.fromResponse(event, this.publicFileUrls));
      }
    }
    return result;
  }
}

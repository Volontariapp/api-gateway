import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { isUUID } from 'class-validator';
import { Logger } from '@volontariapp/logger';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { fetchAllPages } from '../../../common/pagination/index.js';
import type { SearchEventsRequestDTO } from '../dto/request/index.js';
import { HiddenUsersService } from './hidden-users.service.js';

/** Cap of `ids` and `excludedIds` in SearchEvents (ms-event MAX_SEARCH_IDS). */
export const MAX_SEARCH_IDS = 1000;

/**
 * How the social filters of a search reach ms-event:
 * - `none`: no social filter, the search is not restricted;
 * - `empty`: nothing can match, ms-event is not called;
 * - `ids`: only these events (an `only*ByFriends` filter, exclusions applied by ms-social);
 * - `excluded`: every event but these (`exclude*` filters only).
 */
export type SocialSearchScope =
  | { kind: 'none' }
  | { kind: 'empty' }
  | { kind: 'ids'; ids: string[] }
  | { kind: 'excluded'; excludedIds: string[] };

/**
 * Turns the social filters of a search into ids for ms-event. The `exclude*` filters alone select
 * "every event but a few": sending that complement as `ids` breaks past MAX_SEARCH_IDS events, so
 * the small excluded set is sent as `excludedIds` instead.
 */
@Injectable()
export class EventSocialFilterService implements OnModuleInit {
  private readonly logger = new Logger({ context: EventSocialFilterService.name });
  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    private readonly hiddenUsers: HiddenUsersService,
  ) {}

  onModuleInit() {
    this.participationQueryService = this.socialClient.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  async resolve(request: SearchEventsRequestDTO, metadata: Metadata): Promise<SocialSearchScope> {
    const onlyFriends =
      request.onlyParticipatedByFriends === true ||
      request.onlyWishedByFriends === true ||
      request.onlyCreatedByFriends === true;
    if (onlyFriends) {
      const ids = this.capped(await this.recommendedIds(request, metadata), 'ids');
      return ids.length === 0 ? { kind: 'empty' } : { kind: 'ids', ids };
    }

    const excludedIds = this.capped(await this.excludedIds(request, metadata), 'excludedIds');
    return excludedIds.length === 0 ? { kind: 'none' } : { kind: 'excluded', excludedIds };
  }

  private async recommendedIds(
    request: SearchEventsRequestDTO,
    metadata: Metadata,
  ): Promise<string[]> {
    const filters = {
      excludeCreatedByMe: request.excludeCreatedByMe ?? false,
      excludeBlockedUsers: request.excludeBlockedUsers ?? false,
      excludeParticipatedByMe: request.excludeParticipatedByMe ?? false,
      excludeWishedByMe: request.excludeWishedByMe ?? false,
      onlyParticipatedByFriends: request.onlyParticipatedByFriends ?? false,
      onlyWishedByFriends: request.onlyWishedByFriends ?? false,
      onlyCreatedByFriends: request.onlyCreatedByFriends ?? false,
    };
    return fetchAllPages((pagination) =>
      firstValueFrom(
        this.participationQueryService.getRecommendedEventIds({ ...filters, pagination }, metadata),
      ),
    );
  }

  private async excludedIds(request: SearchEventsRequestDTO, metadata: Metadata) {
    const sets = await Promise.all([
      request.excludeCreatedByMe === true
        ? fetchAllPages((pagination) =>
            firstValueFrom(this.participationQueryService.getUserEvent({ pagination }, metadata)),
          )
        : [],
      request.excludeParticipatedByMe === true
        ? fetchAllPages((pagination) =>
            firstValueFrom(
              this.participationQueryService.getUserParticipateEvent({ pagination }, metadata),
            ),
          )
        : [],
      request.excludeWishedByMe === true
        ? fetchAllPages((pagination) =>
            firstValueFrom(
              this.participationQueryService.getUserWishEvent({ pagination }, metadata),
            ),
          )
        : [],
      request.excludeBlockedUsers === true ? this.eventsOfHiddenUsers(metadata) : [],
    ]);
    return [...new Set(sets.flat())];
  }

  /** Events created by a user the reader blocked or who blocked the reader. */
  private async eventsOfHiddenUsers(metadata: Metadata): Promise<string[]> {
    const hidden = [...(await this.hiddenUsers.hiddenUserIds(metadata))];
    const perUser = await Promise.all(
      hidden.map((userId) =>
        fetchAllPages((pagination) =>
          firstValueFrom(
            this.participationQueryService.adminGetUserEvent({ userId, pagination }, metadata),
          ),
        ),
      ),
    );
    return perUser.flat();
  }

  /**
   * ms-event rejects the whole search (INVALID_ARGUMENT, 400) when one id is not a UUID or when a
   * list exceeds MAX_SEARCH_IDS. A SocialEvent node read while another request deletes it can come
   * back without its eventId (empty string on the wire): such ids are dropped, and a longer list is
   * cut with a warning rather than failing the search.
   */
  private capped(ids: string[], field: 'ids' | 'excludedIds'): string[] {
    const valid = ids.filter((id) => isUUID(id));
    if (valid.length < ids.length) {
      this.logger.warn(`Dropped ${String(ids.length - valid.length)} ${field} that are not UUIDs`);
    }
    if (valid.length > MAX_SEARCH_IDS) {
      this.logger.warn(
        `Cut ${field} from ${String(valid.length)} to ${String(MAX_SEARCH_IDS)} (ms-event cap)`,
      );
      return valid.slice(0, MAX_SEARCH_IDS);
    }
    return valid;
  }
}

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
  RANKING_QUERY_SERVICE_NAME,
  RankingQueryServiceClient,
  type GetRankingEventsQuery,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE, RANKING_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { PublicFileUrlService } from '../../storage/public-file-url.service.js';
import { EventParticipantsService } from '../../event/services/event-participants.service.js';
import { EventDTO } from '../../event/dto/common/event.dto.js';
import { EMPTY_RANKING_PAGE } from '../constants/ranking.constants.js';
import { buildRankedEventsSearchQuery } from '../helpers/ranking-content-query.helper.js';
import { isEventFull, isEventOpen } from '../helpers/ranked-event-filter.helper.js';
import { orderByRanking } from '../helpers/ranking-order.helper.js';
import { RankedEventDTO } from '../dto/common/ranked-event.dto.js';
import { GetRankingEventsResponseDTO } from '../dto/response/get-ranking-events.response.dto.js';
import type { RankingPageOnWire } from '../types/ranking-wire.type.js';

/**
 * GET /ranking/events: the order comes from ms-ranking, the content from ms-event. A missing list
 * makes ms-ranking raise FALLBACK_ACTIVATED, which is not caught here: the global filter turns it
 * into a 206.
 */
@Injectable()
export class RankedEventsService implements OnModuleInit {
  private readonly logger = new Logger({ context: RankedEventsService.name });
  private rankingQueryService!: WithMetadata<RankingQueryServiceClient>;
  private eventQueryService!: WithMetadata<EventQueryServiceClient>;

  constructor(
    @Inject(RANKING_PACKAGE) private readonly rankingClient: ClientGrpc,
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
    private readonly publicFileUrls: PublicFileUrlService,
    private readonly participants: EventParticipantsService,
  ) {}

  onModuleInit() {
    this.rankingQueryService = this.rankingClient.getService<RankingQueryServiceClient>(
      RANKING_QUERY_SERVICE_NAME,
    );
    this.eventQueryService =
      this.eventClient.getService<EventQueryServiceClient>(EVENT_QUERY_SERVICE_NAME);
  }

  async read(
    query: GetRankingEventsQuery,
    metadata: Metadata,
    now: Date = new Date(),
  ): Promise<GetRankingEventsResponseDTO> {
    const response = await firstValueFrom(
      this.rankingQueryService.getRankingEvents(query, metadata),
    );
    const page: RankingPageOnWire = response.page ?? EMPTY_RANKING_PAGE;
    if (page.items.length === 0) {
      return GetRankingEventsResponseDTO.fromPage([], 0, page);
    }

    const ids = page.items.map((item) => item.id);
    const search = await firstValueFrom(
      this.eventQueryService.searchEvents(buildRankedEventsSearchQuery(ids), metadata),
    );
    const events = search.events.map((event) => EventDTO.fromResponse(event, this.publicFileUrls));

    const open = orderByRanking(page.items, events).filter(({ content }) =>
      isEventOpen(content, now),
    );
    // currentParticipants is only known after enrichment: the capacity filter comes last.
    await this.participants.enrichAll(
      open.map(({ content }) => content),
      metadata,
    );
    const ranked = open
      .filter(({ content }) => !isEventFull(content))
      .map(({ content, item }) => RankedEventDTO.fromRankedEvent(content, item));

    this.logger.log(
      `Ranked events page: ${String(page.items.length)} ranked, ${String(ranked.length)} served`,
    );
    return GetRankingEventsResponseDTO.fromPage(ranked, page.totalCount, page);
  }
}

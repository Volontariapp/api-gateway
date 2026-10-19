import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser, type AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { GatewayController } from '../../../../common/decorators/gateway-controller.decorator.js';
import { GetRankingEventsRequestDTO, GetRankingFeedRequestDTO } from '../../dto/request/index.js';
import {
  GetRankingEventsResponseDTO,
  GetRankingFeedResponseDTO,
} from '../../dto/response/index.js';
import { RankedEventsService } from '../../services/ranked-events.service.js';
import { RankedFeedService } from '../../services/ranked-feed.service.js';
import { RANKING_FALLBACK_DESCRIPTION } from '../../constants/ranking.constants.js';

/**
 * Own prefix on purpose: `GET /events/ranking` would be captured by `GET /events/:id`
 * (EventQueryController). The routing test keeps it that way.
 */
@GatewayController('Ranking', {
  extraModels: [GetRankingEventsResponseDTO, GetRankingFeedResponseDTO],
})
@Controller('ranking')
export class RankingQueryController {
  private readonly logger = new Logger({ context: RankingQueryController.name });

  constructor(
    private readonly rankedEvents: RankedEventsService,
    private readonly rankedFeed: RankedFeedService,
  ) {}

  @ApiOperation({
    summary: 'Ranked events of the current user (swipe list)',
    description:
      'Events in ranking order, without the ones that started, ended or are full. A page can be shorter than limit: read ranking.hasMore.',
  })
  @ApiResponse({ status: 200, type: GetRankingEventsResponseDTO })
  @ApiResponse({ status: 206, description: RANKING_FALLBACK_DESCRIPTION })
  @Get('events')
  getRankedEvents(
    @Query() request: GetRankingEventsRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Promise<GetRankingEventsResponseDTO> {
    this.logger.log(`Reading ranked events for user ${user.id}`);
    return this.rankedEvents.read(request.toQuery(), req['internalMetadata'] as Metadata);
  }

  @ApiOperation({
    summary: 'Ranked post feed of the current user',
    description:
      'Posts in ranking order, without the authors the user blocked or who blocked the user. A page can be shorter than limit: read ranking.hasMore.',
  })
  @ApiResponse({ status: 200, type: GetRankingFeedResponseDTO })
  @ApiResponse({ status: 206, description: RANKING_FALLBACK_DESCRIPTION })
  @Get('feed')
  getRankedFeed(
    @Query() request: GetRankingFeedRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Promise<GetRankingFeedResponseDTO> {
    this.logger.log(`Reading ranked feed for user ${user.id}`);
    return this.rankedFeed.read(request.toQuery(), req['internalMetadata'] as Metadata);
  }
}

import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseParticipationGrpcController } from '../../base-grpc.controller.js';
import {
  GetUserEventsRequestDTO,
  GetUserParticipationsRequestDTO,
  GetUserWishesRequestDTO,
  GetEventParticipantsRequestDTO,
} from '../../../dto/request/index.js';
import { ExistsResponseDTO, IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Participation - Queries')
@Controller('social')
export class ParticipationQueryController extends BaseParticipationGrpcController {
  @Get('events/created')
  @ApiOperation({ summary: 'Get events created by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  getUserCreatedEventsSelf(
    @Query() query: GetUserEventsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserEvent({ pagination }, metadata);
  }

  @Get('events/participated')
  @ApiOperation({ summary: 'Get events current user participates in' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  getUserParticipatedEventsSelf(
    @Query() query: GetUserParticipationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserParticipateEvent({ pagination }, metadata);
  }

  @Get('events/wished')
  @ApiOperation({ summary: 'Get events wished by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  getUserWishedEventsSelf(
    @Query() query: GetUserWishesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserWishEvent({ pagination }, metadata);
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Check if event node exists' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social event existence', 'details'))
  getEventNode(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getEventNode({ eventId }, metadata);
  }

  @Get('events/:eventId/participants')
  @ApiOperation({ summary: 'Get list of participants for an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching event participants', 'details'))
  getEventParticipants(
    @Param('eventId') eventId: string,
    @Query() query: GetEventParticipantsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getEventParticipants({ eventId, pagination }, metadata);
  }
}

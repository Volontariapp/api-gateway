import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseParticipationGrpcController } from '../base-grpc.controller.js';
import {
  GetUserEventsRequestDTO,
  GetUserParticipationsRequestDTO,
  GetUserWishesRequestDTO,
  GetEventParticipantsRequestDTO,
} from '../../dto/request/index.js';
import { ExistsResponseDTO, IdsListResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Participation - Queries')
@Controller('social')
export class ParticipationQueryController extends BaseParticipationGrpcController {
  @Get('events/:eventId')
  @ApiOperation({ summary: 'Check if event node exists' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social event existence', 'details'))
  getEventNode(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getEventNode({ eventId }, metadata);
  }

  @Get('users/:userId/events/created')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get events created by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  getUserCreatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserEventsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserEvent(query.toQuery(), metadata);
  }

  @Get('users/:userId/events/participated')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get events a user participates in' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  getUserParticipatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserParticipationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserParticipateEvent(query.toQuery(), metadata);
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
    query.eventId = eventId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getEventParticipants(query.toQuery(), metadata);
  }

  @Get('users/:userId/events/wished')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get events wished by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  getUserWishedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserWishesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserWishEvent(query.toQuery(), metadata);
  }

  @Get('events/created')
  @ApiOperation({ summary: 'Get events created by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  getUserCreatedEventsSelf(
    @Query() query: GetUserEventsRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserEvent(query.toQuery(), metadata);
  }

  @Get('events/participated')
  @ApiOperation({ summary: 'Get events current user participates in' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  getUserParticipatedEventsSelf(
    @Query() query: GetUserParticipationsRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserParticipateEvent(query.toQuery(), metadata);
  }

  @Get('events/wished')
  @ApiOperation({ summary: 'Get events wished by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  getUserWishedEventsSelf(
    @Query() query: GetUserWishesRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserWishEvent(query.toQuery(), metadata);
  }
}

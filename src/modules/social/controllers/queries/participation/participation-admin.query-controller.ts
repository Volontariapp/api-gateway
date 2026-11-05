import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseParticipationGrpcController } from '../../base-grpc.controller.js';
import {
  GetUserEventsRequestDTO,
  GetUserParticipationsRequestDTO,
  GetUserWishesRequestDTO,
} from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Participation - Admin Queries', { admin: true })
@Controller('social')
export class ParticipationAdminQueryController extends BaseParticipationGrpcController {
  @Get('users/:userId/events/created')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get events created by a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  getUserCreatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserEventsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetUserEvent({ userId, pagination }, metadata);
  }

  @Get('users/:userId/events/participated')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get events a user participates in (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  getUserParticipatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserParticipationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetUserParticipateEvent({ userId, pagination }, metadata);
  }

  @Get('users/:userId/events/wished')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get events wished by a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  getUserWishedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserWishesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetUserWishEvent({ userId, pagination }, metadata);
  }
}

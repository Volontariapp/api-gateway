import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_EVENT_NOT_FOUND,
  SOCIAL_EVENT_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_NOT_FOUND,
  SOCIAL_WISH_ALREADY_EXISTS,
  SOCIAL_WISH_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseParticipationGrpcController } from '../../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Participation - Admin', { admin: true })
@Controller('social')
export class ParticipationAdminCommandController extends BaseParticipationGrpcController {
  @Post('events/:eventId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Create a social event node (Admin)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_ALREADY_EXISTS('eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating social event node', 'details'))
  createEventNode(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createEventNode({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event node created' })));
  }

  @Delete('events/:eventId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Delete a social event node (Admin)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social event node', 'details'))
  deleteEventNode(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteEventNode({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event node deleted' })));
  }

  @Post('users/:userId/events/:eventId/own')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Link a user as creator of an event (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => DATABASE_ERROR('setting event creator', 'details'))
  ownEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postUserEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event ownership linked' })));
  }

  @Delete('users/:userId/events/:eventId/own')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unlink a user from event creation (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => DATABASE_ERROR('removing event creator', 'details'))
  disownEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event ownership unlinked' })));
  }

  @Post('users/:userId/events/:eventId/participate')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'User participates in an event (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event participation', 'details'))
  participate(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminPostUserParticipateEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation linked' })));
  }

  @Delete('users/:userId/events/:eventId/participate')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'User stops participating in an event (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event participation', 'details'))
  unparticipate(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminDeleteUserParticipateEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation unlinked' })));
  }

  @Post('users/:userId/events/:eventId/wish')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Add event to user wishes (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event wish', 'details'))
  wishEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminPostUserWishEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event added to wishes' })));
  }

  @Delete('users/:userId/events/:eventId/wish')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Remove event from user wishes (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event wish', 'details'))
  unwishEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminDeleteUserWishEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event removed from wishes' })));
  }
}

import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_EVENT_NOT_FOUND,
  SOCIAL_EVENT_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_NOT_FOUND,
  SOCIAL_WISH_ALREADY_EXISTS,
  SOCIAL_WISH_NOT_FOUND,
  DATABASE_ERROR,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseParticipationGrpcController } from '../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Participation - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('social')
export class ParticipationCommandController extends BaseParticipationGrpcController {
  @Post('events/:eventId')
  @ApiOperation({ summary: 'Create a social event node' })
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
  @ApiOperation({ summary: 'Delete a social event node' })
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
  @ApiOperation({
    summary: 'Link a user as creator of an event',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nManually assign event creation to a user. Useful for correcting creator information or migrating events.',
  })
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
  @ApiOperation({
    summary: 'Unlink a user from event creation',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nRevoke event creator status from a user. The event will remain but will have no creator.',
  })
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
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'User participates in an event' })
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
      .postUserParticipateEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation linked' })));
  }

  @Delete('users/:userId/events/:eventId/participate')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'User stops participating in an event' })
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
      .deleteUserParticipateEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation unlinked' })));
  }

  @Post('users/:userId/events/:eventId/wish')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Add event to user wishes' })
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
      .postUserWishEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event added to wishes' })));
  }

  @Delete('users/:userId/events/:eventId/wish')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Remove event from user wishes' })
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
      .deleteUserWishEvent({ userId, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event removed from wishes' })));
  }

  @Post('events/:eventId/participate')
  @ApiOperation({ summary: 'User participates in an event (self)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event participation', 'details'))
  participateSelf(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postUserParticipateEvent({ userId: user.id, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation linked' })));
  }

  @Delete('events/:eventId/participate')
  @ApiOperation({ summary: 'User stops participating in an event (self)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event participation', 'details'))
  unparticipateSelf(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserParticipateEvent({ userId: user.id, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation unlinked' })));
  }

  @Post('events/:eventId/wish')
  @ApiOperation({ summary: 'Add event to current user wishes' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event wish', 'details'))
  wishEventSelf(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postUserWishEvent({ userId: user.id, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event added to wishes' })));
  }

  @Delete('events/:eventId/wish')
  @ApiOperation({ summary: 'Remove event from current user wishes' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event wish', 'details'))
  unwishEventSelf(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserWishEvent({ userId: user.id, eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event removed from wishes' })));
  }
}

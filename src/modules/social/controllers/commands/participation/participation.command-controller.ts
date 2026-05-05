import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_EVENT_NOT_FOUND,
  SOCIAL_PARTICIPATION_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_NOT_FOUND,
  SOCIAL_WISH_ALREADY_EXISTS,
  SOCIAL_WISH_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseParticipationGrpcController } from '../../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Participation - Commands')
@Controller('social')
export class ParticipationCommandController extends BaseParticipationGrpcController {
  @Post('events/:eventId/participate')
  @ApiOperation({ summary: 'User participates in an event (self)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event participation', 'details'))
  participateSelf(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postUserParticipateEvent({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation linked' })));
  }

  @Delete('events/:eventId/participate')
  @ApiOperation({ summary: 'User stops participating in an event (self)' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event participation', 'details'))
  unparticipateSelf(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserParticipateEvent({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Participation unlinked' })));
  }

  @Post('events/:eventId/wish')
  @ApiOperation({ summary: 'Add event to current user wishes' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_ALREADY_EXISTS('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('creating event wish', 'details'))
  wishEventSelf(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postUserWishEvent({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event added to wishes' })));
  }

  @Delete('events/:eventId/wish')
  @ApiOperation({ summary: 'Remove event from current user wishes' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_WISH_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting event wish', 'details'))
  unwishEventSelf(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserWishEvent({ eventId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Event removed from wishes' })));
  }
}

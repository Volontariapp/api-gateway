import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser, type AuthUser } from '@volontariapp/auth';
import {
  BRIDGE_CONNECTION_FAILED,
  CustomApiError,
  EVENT_NOT_FOUND,
  INVALID_PARAMETER,
} from '@volontariapp/errors-nest';
import { GatewayController } from '../../../common/decorators/gateway-controller.decorator.js';
import { StopLiveSharingQueryDTO } from '../dto/common/stop-live-sharing-query.dto.js';
import { LiveSharingService } from '../services/live-sharing.service.js';

/**
 * The caller is always `@CurrentUser()`: no user id is read from the path, the query or the body.
 * Routes live under their own `live` prefix, away from `GET /events/:id`.
 */
@GatewayController('Live')
@Controller('live/events/:eventId/sharing')
export class LiveSharingController {
  constructor(private readonly sharing: LiveSharingService) {}

  @ApiOperation({
    summary: 'Authorize the sharing of my position with the organizer',
    description:
      'The caller must take part in a published or running event, between 30 minutes before its ' +
      'start and its end. The organizer, the location and the dates are read from the event, ' +
      'never from the request. An unknown event and every refusal (state, window, not a ' +
      'participant) give the same 404 answer.',
  })
  @ApiParam({ name: 'eventId', example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  @ApiResponse({ status: 204, description: 'Sharing authorized' })
  @CustomApiError(() => EVENT_NOT_FOUND('eventId'), {
    description: 'Unknown event, or the sharing is not allowed for this caller',
  })
  @CustomApiError(() => INVALID_PARAMETER('eventId', 'the organizer cannot share a position'))
  @CustomApiError(() => BRIDGE_CONNECTION_FAILED('live sharing', 'service unavailable'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put()
  async authorize(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Promise<void> {
    await this.sharing.grant(user, eventId, req['internalMetadata'] as Metadata);
  }

  @ApiOperation({
    summary: 'Stop sharing my position',
    description: 'Withdraws the authorization of the caller for this event.',
  })
  @ApiParam({ name: 'eventId', example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  @ApiResponse({ status: 204, description: 'Sharing stopped' })
  @CustomApiError(() => INVALID_PARAMETER('reason', 'must be one of ARRIVED, STOPPED, LEFT'))
  @CustomApiError(() => BRIDGE_CONNECTION_FAILED('live sharing', 'service unavailable'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async stop(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: StopLiveSharingQueryDTO,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.sharing.revoke(user, eventId, query.toReason());
  }
}

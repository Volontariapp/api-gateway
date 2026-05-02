import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
  Req,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  PARTICIPATION_COMMAND_SERVICE_NAME,
  ParticipationCommandServiceClient,
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import {
  ActionSuccessResponseDTO,
  ExistsResponseDTO,
  IdsListResponseDTO,
} from '../dto/response/index.js';
import {
  GetUserEventsRequestDTO,
  GetUserParticipationsRequestDTO,
  GetUserWishesRequestDTO,
  GetEventParticipantsRequestDTO,
} from '../dto/request/index.js';
import {
  CustomApiError,
  SOCIAL_EVENT_NOT_FOUND,
  SOCIAL_EVENT_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_ALREADY_EXISTS,
  SOCIAL_PARTICIPATION_NOT_FOUND,
  SOCIAL_WISH_ALREADY_EXISTS,
  SOCIAL_WISH_NOT_FOUND,
  DATABASE_ERROR,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Participation')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('social')
export class ParticipationController implements OnModuleInit {
  private commandService!: WithMetadata<ParticipationCommandServiceClient>;
  private queryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<ParticipationCommandServiceClient>(
      PARTICIPATION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

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

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Check if event node exists' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social event existence', 'details'))
  getEventNode(@Param('eventId') eventId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getEventNode({ eventId }, metadata);
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
  @ApiOperation({ summary: 'Link a user as creator of an event' })
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
  @ApiOperation({ summary: 'Unlink a user from event creation' })
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

  @Get('users/:userId/events/created')
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

  @Post('users/:userId/events/:eventId/wish')
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

  @Get('users/:userId/events/wished')
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
}

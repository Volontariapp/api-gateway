import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
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
} from '@volontariapp/errors-nest';

@ApiTags('Social - Participation')
@Controller('social')
export class ParticipationController implements OnModuleInit {
  private commandService!: ParticipationCommandServiceClient;
  private queryService!: ParticipationQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService =
      this.client.getService<ParticipationCommandServiceClient>(
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
  createEventNode(@Param('eventId') eventId: string) {
    return this.commandService
      .createEventNode({ eventId })
      .pipe(map(() => ({ success: true, message: 'Event node created' })));
  }

  @Get('events/:eventId')
  @ApiOperation({ summary: 'Check if event node exists' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() =>
    DATABASE_ERROR('checking social event existence', 'details'),
  )
  getEventNode(@Param('eventId') eventId: string) {
    return this.queryService.getEventNode({ eventId });
  }

  @Delete('events/:eventId')
  @ApiOperation({ summary: 'Delete a social event node' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social event node', 'details'))
  deleteEventNode(@Param('eventId') eventId: string) {
    return this.commandService
      .deleteEventNode({ eventId })
      .pipe(map(() => ({ success: true, message: 'Event node deleted' })));
  }

  @Post('users/:userId/events/:eventId/own')
  @ApiOperation({ summary: 'Link a user as creator of an event' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => DATABASE_ERROR('setting event creator', 'details'))
  ownEvent(@Param('userId') userId: string, @Param('eventId') eventId: string) {
    return this.commandService
      .postUserEvent({ userId, eventId })
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
  ) {
    return this.commandService
      .deleteUserEvent({ userId, eventId })
      .pipe(
        map(() => ({ success: true, message: 'Event ownership unlinked' })),
      );
  }

  @Post('users/:userId/events/:eventId/participate')
  @ApiOperation({ summary: 'User participates in an event' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() =>
    SOCIAL_PARTICIPATION_ALREADY_EXISTS('userId', 'eventId'),
  )
  @CustomApiError(() =>
    DATABASE_ERROR('creating event participation', 'details'),
  )
  participate(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.commandService
      .postUserParticipateEvent({ userId, eventId })
      .pipe(map(() => ({ success: true, message: 'Participation linked' })));
  }

  @Delete('users/:userId/events/:eventId/participate')
  @ApiOperation({ summary: 'User stops participating in an event' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() => SOCIAL_PARTICIPATION_NOT_FOUND('userId', 'eventId'))
  @CustomApiError(() =>
    DATABASE_ERROR('deleting event participation', 'details'),
  )
  unparticipate(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.commandService
      .deleteUserParticipateEvent({ userId, eventId })
      .pipe(map(() => ({ success: true, message: 'Participation unlinked' })));
  }

  @Get('users/:userId/events/created')
  @ApiOperation({ summary: 'Get events created by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() =>
    DATABASE_ERROR('fetching user created events', 'details'),
  )
  getUserCreatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserEventsRequestDTO,
  ) {
    query.userId = userId;
    return this.queryService.getUserEvent(query.toQuery());
  }

  @Get('users/:userId/events/participated')
  @ApiOperation({ summary: 'Get events a user participates in' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() =>
    DATABASE_ERROR('fetching user participations', 'details'),
  )
  getUserParticipatedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserParticipationsRequestDTO,
  ) {
    query.userId = userId;
    return this.queryService.getUserParticipateEvent(query.toQuery());
  }

  @Get('events/:eventId/participants')
  @ApiOperation({ summary: 'Get list of participants for an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() =>
    DATABASE_ERROR('fetching event participants', 'details'),
  )
  getEventParticipants(
    @Param('eventId') eventId: string,
    @Query() query: GetEventParticipantsRequestDTO,
  ) {
    query.eventId = eventId;
    return this.queryService.getEventParticipants(query.toQuery());
  }

  @Post('users/:userId/events/:eventId/wish')
  @ApiOperation({ summary: 'Add event to user wishes' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() =>
    SOCIAL_WISH_ALREADY_EXISTS('userId', 'eventId'),
  )
  @CustomApiError(() =>
    DATABASE_ERROR('creating event wish', 'details'),
  )
  wishEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.commandService
      .postUserWishEvent({ userId, eventId })
      .pipe(map(() => ({ success: true, message: 'Event added to wishes' })));
  }

  @Delete('users/:userId/events/:eventId/wish')
  @ApiOperation({ summary: 'Remove event from user wishes' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_EVENT_NOT_FOUND('eventId'))
  @CustomApiError(() =>
    SOCIAL_WISH_NOT_FOUND('userId', 'eventId'),
  )
  @CustomApiError(() =>
    DATABASE_ERROR('deleting event wish', 'details'),
  )
  unwishEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.commandService
      .deleteUserWishEvent({ userId, eventId })
      .pipe(map(() => ({ success: true, message: 'Event removed from wishes' })));
  }

  @Get('users/:userId/events/wished')
  @ApiOperation({ summary: 'Get events wished by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() =>
    DATABASE_ERROR('fetching user wished events', 'details'),
  )
  getUserWishedEvents(
    @Param('userId') userId: string,
    @Query() query: GetUserWishesRequestDTO,
  ) {
    query.userId = userId;
    return this.queryService.getUserWishEvent(query.toQuery());
  }
}

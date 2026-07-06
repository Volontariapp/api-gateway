import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { firstValueFrom, map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR, EVENT_NOT_FOUND } from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';
import { EVENT_PACKAGE, SOCIAL_PACKAGE } from '../../../../../grpc/grpc-packages.js';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { WithMetadata } from '../../../../../common/types/grpc.types.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { GetEventRequestDTO, SearchEventsRequestDTO } from '../../../dto/request/index.js';
import {
  GetUserEventsRequestDTO,
  GetUserParticipationsRequestDTO,
  GetUserWishesRequestDTO,
} from '../../../../social/dto/request/index.js';
import {
  GetEventResponseDTO,
  SearchEventsResponseDTO,
  ListRequirementsResponseDTO,
} from '../../../dto/response/index.js';
import { BaseEventGrpcController } from '../../base-grpc.controller.js';

@GatewayController('Events', {
  extraModels: [GetEventResponseDTO],
})
@Controller('events')
export class EventQueryController extends BaseEventGrpcController {
  private readonly logger = new Logger({
    context: EventQueryController.name,
  });

  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(
    @Inject(EVENT_PACKAGE) protected readonly eventClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
  ) {
    super(eventClient);
  }

  override onModuleInit() {
    super.onModuleInit();
    this.participationQueryService = this.socialClient.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  @ApiOperation({
    summary: 'List all events',
    description: 'Fetch a paginated list of all events in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events successfully fetched',
    type: SearchEventsResponseDTO,
  })
  @CustomApiError(() => DATABASE_ERROR('listing events', 'details'))
  @Get()
  async listEvents(@Query() request: SearchEventsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing events');
    const metadata = req['internalMetadata'] as Metadata;
    const hasSocialFilters =
      request.excludeCreatedByMe ??
      request.excludeBlockedUsers ??
      request.excludeParticipatedByMe ??
      request.excludeWishedByMe ??
      request.onlyParticipatedByFriends ??
      request.onlyWishedByFriends ??
      request.onlyCreatedByFriends;

    let eventIds: string[] = [];
    if (hasSocialFilters) {
      this.logger.log('Calling ms-social for recommended event ids');
      const recommendedResponse = await firstValueFrom(
        this.participationQueryService.getRecommendedEventIds(
          {
            excludeCreatedByMe: request.excludeCreatedByMe ?? false,
            excludeBlockedUsers: request.excludeBlockedUsers ?? false,
            excludeParticipatedByMe: request.excludeParticipatedByMe ?? false,
            excludeWishedByMe: request.excludeWishedByMe ?? false,
            onlyParticipatedByFriends: request.onlyParticipatedByFriends ?? false,
            onlyWishedByFriends: request.onlyWishedByFriends ?? false,
            onlyCreatedByFriends: request.onlyCreatedByFriends ?? false,
            pagination: { page: 1, limit: 1000 },
          },
          metadata,
        ),
      );
      eventIds = recommendedResponse.ids;

      if (eventIds.length === 0) {
        return { events: [], totalCount: 0 };
      }
    }

    const query = request.toQuery();
    if (eventIds.length > 0) {
      query.ids = eventIds;
    }

    return firstValueFrom(
      this.queryService
        .searchEvents(query, metadata)
        .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res))),
    );
  }

  @ApiOperation({
    summary: 'Get an event by ID',
    description: 'Fetch a single event by its unique ID.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Event successfully fetched',
    type: GetEventResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('fetching event', 'details'))
  @Get(':id')
  getEvent(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching event with id: ${id}`);
    const request = new GetEventRequestDTO();
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService
      .getEvent(request.toQuery(), metadata)
      .pipe(map((res) => GetEventResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'List event requirements',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ListRequirementsResponseDTO })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('listing requirements', 'details'))
  @Get(':id/requirements')
  listRequirements(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Listing requirements for event: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.listRequirements({ eventId: id }, metadata);
  }

  @Get('created/me')
  @ApiOperation({ summary: 'Get events created by current user' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  getUserCreatedEventsSelf(
    @Query() query: GetUserEventsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService
      .getUserCreatedEvents({ pagination }, metadata)
      .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res, query.page, query.limit)));
  }

  @Get('participated/me')
  @ApiOperation({ summary: 'Get events current user participates in' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  getUserParticipatedEventsSelf(
    @Query() query: GetUserParticipationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService
      .getUserParticipatedEvents({ pagination }, metadata)
      .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res, query.page, query.limit)));
  }

  @Get('wished/me')
  @ApiOperation({ summary: 'Get events wished by current user' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  getUserWishedEventsSelf(
    @Query() query: GetUserWishesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService
      .getUserWishedEvents({ pagination }, metadata)
      .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res, query.page, query.limit)));
  }
}

import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR, EVENT_NOT_FOUND } from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';
import { EVENT_PACKAGE } from '../../../../../grpc/grpc-packages.js';
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
import { PublicFileUrlService } from '../../../../storage/public-file-url.service.js';
import { EventParticipantsService } from '../../../services/event-participants.service.js';
import { EventSocialFilterService } from '../../../services/event-social-filter.service.js';

@GatewayController('Events', {
  extraModels: [GetEventResponseDTO],
})
@Controller('events')
export class EventQueryController extends BaseEventGrpcController {
  private readonly logger = new Logger({
    context: EventQueryController.name,
  });

  constructor(
    @Inject(EVENT_PACKAGE) protected readonly eventClient: ClientGrpc,
    publicFileUrls: PublicFileUrlService,
    private readonly participants: EventParticipantsService,
    private readonly socialFilter: EventSocialFilterService,
  ) {
    super(eventClient, publicFileUrls);
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
    this.logger.debug('Listing events');
    const metadata = req['internalMetadata'] as Metadata;
    const scope = await this.socialFilter.resolve(request, metadata);
    if (scope.kind === 'empty') {
      return SearchEventsResponseDTO.empty(request.page, request.limit);
    }

    const query = request.toQuery();
    if (scope.kind === 'ids') {
      query.ids = scope.ids;
    } else if (scope.kind === 'excluded') {
      query.excludedIds = scope.excludedIds;
      query.excludedOrganizerIds = scope.excludedOrganizerIds;
    }

    const result = await firstValueFrom(this.queryService.searchEvents(query, metadata));
    const dto = SearchEventsResponseDTO.fromResponse(
      result,
      this.publicFileUrls,
      request.page,
      request.limit,
    );
    return this.enrichSearchEventsResponse(dto, metadata);
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
  async getEvent(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.debug(`Fetching event with id: ${id}`);
    const request = new GetEventRequestDTO();
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;

    const result = await firstValueFrom(this.queryService.getEvent(request.toQuery(), metadata));
    const dto = GetEventResponseDTO.fromResponse(result, this.publicFileUrls);
    await this.participants.enrich(dto.event, metadata);
    return dto;
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
    this.logger.debug(`Listing requirements for event: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.listRequirements({ eventId: id }, metadata);
  }

  @Get('created/me')
  @ApiOperation({ summary: 'Get events created by current user' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user created events', 'details'))
  async getUserCreatedEventsSelf(
    @Query() query: GetUserEventsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    const result = await firstValueFrom(
      this.queryService.getUserCreatedEvents({ pagination }, metadata),
    );
    const dto = SearchEventsResponseDTO.fromResponse(
      result,
      this.publicFileUrls,
      query.page,
      query.limit,
    );
    return this.enrichSearchEventsResponse(dto, metadata);
  }

  @Get('participated/me')
  @ApiOperation({ summary: 'Get events current user participates in' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user participations', 'details'))
  async getUserParticipatedEventsSelf(
    @Query() query: GetUserParticipationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    const result = await firstValueFrom(
      this.queryService.getUserParticipatedEvents({ pagination }, metadata),
    );
    const dto = SearchEventsResponseDTO.fromResponse(
      result,
      this.publicFileUrls,
      query.page,
      query.limit,
    );
    return this.enrichSearchEventsResponse(dto, metadata);
  }

  @Get('wished/me')
  @ApiOperation({ summary: 'Get events wished by current user' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user wished events', 'details'))
  async getUserWishedEventsSelf(
    @Query() query: GetUserWishesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    const result = await firstValueFrom(
      this.queryService.getUserWishedEvents({ pagination }, metadata),
    );
    const dto = SearchEventsResponseDTO.fromResponse(
      result,
      this.publicFileUrls,
      query.page,
      query.limit,
    );
    return this.enrichSearchEventsResponse(dto, metadata);
  }

  private async enrichSearchEventsResponse(
    dto: SearchEventsResponseDTO,
    metadata: Metadata,
  ): Promise<SearchEventsResponseDTO> {
    await this.participants.enrichAll(dto.events, metadata);
    return dto;
  }
}

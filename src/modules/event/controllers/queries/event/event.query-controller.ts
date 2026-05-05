import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR, EVENT_NOT_FOUND } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { GetEventRequestDTO, SearchEventsRequestDTO } from '../../../dto/request/index.js';
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
  listEvents(@Query() request: SearchEventsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing events');
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService
      .searchEvents(request.toQuery(), metadata)
      .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res)));
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
}

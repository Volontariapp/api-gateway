import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiInternalServerErrorResponse,
  CustomApiError,
  EVENT_NOT_FOUND,
  DATABASE_ERROR,
  MISSING_ACCESS_TOKEN,
  INSUFFICIENT_PERMISSIONS,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { SearchEventsRequestDTO, GetEventRequestDTO } from '../../dto/request/index.js';
import {
  GetEventResponseDTO,
  SearchEventsResponseDTO,
  ListRequirementsResponseDTO,
} from '../../dto/response/index.js';
import { BaseEventGrpcController } from '../base-grpc.controller.js';

@ApiTags('Events')
@ApiExtraModels(GetEventResponseDTO, SearchEventsResponseDTO, ListRequirementsResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@CustomApiError(INSUFFICIENT_PERMISSIONS)
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('events')
export class EventQueryController extends BaseEventGrpcController {
  private readonly logger = new Logger({
    context: EventQueryController.name,
  });

  @ApiOperation({
    summary: 'Search events with filters',
    description: 'Returns a paginated list of events matching search criteria.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results successfully retrieved',
    type: SearchEventsResponseDTO,
  })
  @CustomApiError(() => DATABASE_ERROR('searching events', 'details'))
  @Get()
  searchEvents(@Query() request: SearchEventsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log(`Searching events with filters: ${JSON.stringify(request)}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService
      .searchEvents(request.toQuery(), metadata)
      .pipe(map((res) => SearchEventsResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Get an event by ID',
    description: 'Retrieves full details of a specific event.',
  })
  @ApiParam({ name: 'id', example: '' })
  @ApiResponse({
    status: 200,
    description: 'Event details successfully retrieved',
    type: GetEventResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('finding event', 'details'))
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
    summary: 'List requirements for an event',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: ListRequirementsResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('listing requirements', 'details'))
  @Get(':id/requirements')
  listRequirements(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Listing requirements for event with id: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.listRequirements({ eventId: id }, metadata);
  }
}

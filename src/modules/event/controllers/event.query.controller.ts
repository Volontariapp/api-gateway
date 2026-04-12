import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { SearchEventsQueryDTO } from '../dto/request/query/search-events.query.dto.js';
import {
  GetEventResponseDTO,
  SearchEventsResponseDTO,
  ListRequirementsResponseDTO,
} from '../dto/response/event-responses.dto.js';
import {
  GetEventQueryDTO,
  ListRequirementsQueryDTO,
} from '../dto/request/query/event.query.dto.js';

@ApiTags('Events')
@Controller('events')
export class EventQueryController implements OnModuleInit {
  private eventService!: EventQueryServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.eventService = this.client.getService<EventQueryServiceClient>(
      EVENT_QUERY_SERVICE_NAME,
    );
  }

  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: GetEventResponseDTO })
  @Get(':id')
  getEvent(@Param('id') id: string) {
    const query = new GetEventQueryDTO();
    query.id = id;
    return this.eventService.getEvent(query.toQuery());
  }

  @ApiOperation({ summary: 'Search events with filters' })
  @ApiResponse({ status: 200, type: SearchEventsResponseDTO })
  @Get()
  searchEvents(@Query() query: SearchEventsQueryDTO) {
    return this.eventService.searchEvents(query.toQuery());
  }

  @ApiOperation({ summary: 'List requirements for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: ListRequirementsResponseDTO })
  @Get(':id/requirements')
  listRequirements(@Param('id') id: string) {
    const query = new ListRequirementsQueryDTO();
    query.eventId = id;
    return this.eventService.listRequirements(query.toQuery());
  }
}

import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_SERVICE_NAME,
  EventServiceClient,
} from '@volontariapp/contracts';
import type { EventQuery, ListEventsQuery } from '@volontariapp/contracts';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Events')
@Controller('events')
export class EventQueryController implements OnModuleInit {
  private eventService!: EventServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.eventService =
      this.client.getService<EventServiceClient>(EVENT_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all events' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  listEvents(@Query() query: { page?: number; limit?: number }) {
    return this.eventService.listEvents({
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
    } as ListEventsQuery);
  }

  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.eventService.getEvent({ id } as EventQuery);
  }
}

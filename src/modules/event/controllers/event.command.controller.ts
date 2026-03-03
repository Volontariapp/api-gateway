import {
  Body,
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_SERVICE_NAME,
  EventServiceClient,
} from '@volontariapp/contracts';
import type {
  CreateEventCommand,
  UpdateEventCommand,
} from '@volontariapp/contracts';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Events')
@Controller('events')
export class EventCommandController implements OnModuleInit {
  private eventService!: EventServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.eventService =
      this.client.getService<EventServiceClient>(EVENT_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Tech Conference 2026' },
        description: {
          type: 'string',
          example: 'A conference about the latest tech trends.',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-15T09:00:00Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-17T18:00:00Z',
        },
        location: { type: 'string', example: 'Paris, France' },
        organizerId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @Post()
  createEvent(@Body() command: CreateEventCommand) {
    return this.eventService.createEvent({
      ...command,
      startDate: command.startDate ? new Date(command.startDate) : undefined,
      endDate: command.endDate ? new Date(command.endDate) : undefined,
    } as CreateEventCommand);
  }

  @ApiOperation({ summary: 'Update an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Tech Conference 2026 (Updated)' },
        description: { type: 'string', example: 'Updated description here.' },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-15T10:00:00Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-18T18:00:00Z',
        },
        location: { type: 'string', example: 'Berlin, Germany' },
      },
    },
  })
  @Patch(':id')
  updateEvent(
    @Param('id') id: string,
    @Body() command: Partial<UpdateEventCommand>,
  ) {
    return this.eventService.updateEvent({
      ...command,
      id,
      startDate: command.startDate ? new Date(command.startDate) : undefined,
      endDate: command.endDate ? new Date(command.endDate) : undefined,
    } as UpdateEventCommand);
  }

  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @Delete(':id')
  deleteEvent(@Param('id') id: string) {
    return this.eventService.deleteEvent({ id });
  }
}

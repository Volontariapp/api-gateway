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
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EventCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { CreateEventCommandDTO } from '../dto/request/command/create-event.command.dto.js';
import { UpdateEventCommandDTO } from '../dto/request/command/update-event.command.dto.js';
import { ChangeEventStateCommandDTO } from '../dto/request/command/change-event-state.command.dto.js';
import { ManageRequirementCommandDTO } from '../dto/request/command/manage-requirement.command.dto.js';
import { DeleteEventCommandDTO } from '../dto/request/command/delete-event.command.dto.js';
import {
  CreateEventResponseDTO,
  UpdateEventResponseDTO,
  ChangeEventStateResponseDTO,
  ManageRequirementsResponseDTO,
  DeleteEventResponseDTO,
} from '../dto/response/event-responses.dto.js';

@ApiTags('Events')
@Controller('events')
export class EventCommandController implements OnModuleInit {
  private eventService!: EventCommandServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.eventService = this.client.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
    );
  }

  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, type: CreateEventResponseDTO })
  @Post()
  createEvent(@Body() command: CreateEventCommandDTO) {
    return this.eventService.createEvent(command.toCommand());
  }

  @ApiOperation({ summary: 'Update an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: UpdateEventResponseDTO })
  @Patch(':id')
  updateEvent(
    @Param('id') _id: string,
    @Body() command: UpdateEventCommandDTO,
  ) {
    return this.eventService.updateEvent(command.toCommand());
  }

  @ApiOperation({ summary: 'Change event state' })
  @ApiResponse({ status: 200, type: ChangeEventStateResponseDTO })
  @Patch(':id/state')
  changeEventState(
    @Param('id') _id: string,
    @Body() command: ChangeEventStateCommandDTO,
  ) {
    return this.eventService.changeEventState(command.toCommand());
  }

  @ApiOperation({ summary: 'Manage event requirements' })
  @ApiResponse({ status: 200, type: ManageRequirementsResponseDTO })
  @Post(':id/requirements')
  manageRequirements(
    @Param('id') _id: string,
    @Body() command: ManageRequirementCommandDTO,
  ) {
    return this.eventService.manageRequirements(command.toCommand());
  }

  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: DeleteEventResponseDTO })
  @Delete(':id')
  deleteEvent(@Param('id') id: string) {
    const cmd = new DeleteEventCommandDTO();
    cmd.id = id;
    return this.eventService.deleteEvent(cmd.toCommand());
  }
}

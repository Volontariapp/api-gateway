import { Body, Controller, Delete, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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
  INVALID_DATE_PARAMETERS,
  EVENT_NOT_FOUND,
  EVENT_ALREADY_EXISTS,
  INVALID_EVENT_STATE_TRANSITION,
  DATABASE_ERROR,
  MISSING_ACCESS_TOKEN,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import type { UUID } from 'crypto';
import { AccessTokenGuard } from '@volontariapp/auth';
import {
  CreateEventRequestDTO,
  UpdateEventRequestDTO,
  ChangeEventStateRequestDTO,
  AddRequirementRequestDTO,
  RemoveRequirementRequestDTO,
} from '../../dto/request/index.js';
import {
  CreateEventResponseDTO,
  UpdateEventResponseDTO,
  ChangeEventStateResponseDTO,
  GetEventResponseDTO,
  ActionSuccessResponseDTO,
} from '../../dto/response/index.js';
import { BaseEventGrpcController } from '../base-grpc.controller.js';

@ApiTags('Events')
@ApiExtraModels(GetEventResponseDTO, ActionSuccessResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Access denied')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('events')
@UseGuards(AccessTokenGuard)
export class EventCommandController extends BaseEventGrpcController {
  private readonly logger = new Logger({
    context: EventCommandController.name,
  });

  @ApiOperation({
    summary: 'Create a new event',
    description: 'Initializes a new event in the system.',
  })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    type: GetEventResponseDTO,
  })
  @CustomApiError(() => INVALID_DATE_PARAMETERS('startAt or endAt is invalid'))
  @CustomApiError(() => EVENT_ALREADY_EXISTS('title'))
  @CustomApiError(() => DATABASE_ERROR('creating event', 'details'))
  @Post()
  createEvent(@Body() request: CreateEventRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log(`Creating event with title: ${request.title}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createEvent(request.toCommand(), metadata)
      .pipe(map((res) => CreateEventResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Update an event by ID',
    description: 'Updates specific fields of an existing event.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Event successfully updated',
    type: GetEventResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => INVALID_DATE_PARAMETERS('startAt or endAt is invalid'))
  @CustomApiError(() => EVENT_ALREADY_EXISTS('title'))
  @CustomApiError(() => DATABASE_ERROR('updating event', 'details'))
  @Patch(':id')
  updateEvent(
    @Param('id') id: string,
    @Body() request: UpdateEventRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating event with id: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .updateEvent(request.toCommand(), metadata)
      .pipe(map((res) => UpdateEventResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Change event state',
    description: 'Updates the state of an event (Draft, Published, etc.).',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: GetEventResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => INVALID_EVENT_STATE_TRANSITION('from', 'to'))
  @CustomApiError(() => DATABASE_ERROR('changing event state', 'details'))
  @Patch(':id/state')
  changeEventState(
    @Param('id') id: string,
    @Body() request: ChangeEventStateRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Changing state for event with id: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .changeEventState(request.toCommand(), metadata)
      .pipe(map((res) => ChangeEventStateResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Add a requirement to an event',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 201,
    type: ActionSuccessResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('adding requirement', 'details'))
  @Post(':id/requirements')
  addRequirement(
    @Param('id') id: UUID,
    @Body() request: AddRequirementRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Adding requirement to event with id: ${id}`);
    request.eventId = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.manageRequirements(request.toCommand(), metadata);
  }

  @ApiOperation({
    summary: 'Remove a requirement from an event',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiParam({ name: 'requirementId', example: 'uuid-456' })
  @ApiResponse({
    status: 200,
    type: ActionSuccessResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('removing requirement', 'details'))
  @Delete(':id/requirements/:requirementId')
  removeRequirement(
    @Param('id') id: UUID,
    @Param('requirementId') requirementId: UUID,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Removing requirement ${requirementId} from event ${id}`);
    const request = new RemoveRequirementRequestDTO();
    request.eventId = id;
    request.requirementId = requirementId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.manageRequirements(request.toCommand(), metadata);
  }

  @ApiOperation({
    summary: 'Delete an event by ID',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: ActionSuccessResponseDTO,
  })
  @CustomApiError(() => EVENT_NOT_FOUND('id'))
  @CustomApiError(() => DATABASE_ERROR('deleting event', 'details'))
  @Delete(':id')
  deleteEvent(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting event with id: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.deleteEvent({ id }, metadata);
  }
}

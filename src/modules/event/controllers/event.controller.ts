import {
  Body,
  Controller,
  Delete,
  Inject,
  Get,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  CustomApiError,
  INVALID_DATE_PARAMETERS,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EventCommandServiceClient,
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
  DeleteEventCommand,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  CreateEventRequestDTO,
  UpdateEventRequestDTO,
  SearchEventsRequestDTO,
  GetEventRequestDTO,
} from '../dto/request/index.js';
import {
  GetEventResponseDTO,
  SearchEventsResponseDTO,
  ActionSuccessResponseDTO,
  ListRequirementsResponseDTO,
} from '../dto/response/index.js';

@ApiTags('Events')
@ApiExtraModels(
  GetEventResponseDTO,
  SearchEventsResponseDTO,
  ListRequirementsResponseDTO,
  ActionSuccessResponseDTO,
)
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiForbiddenResponse('You do not have permission to perform this action')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('events')
export class EventController implements OnModuleInit {
  private readonly logger = new Logger({
    context: EventController.name,
  });
  private commandService!: EventCommandServiceClient;
  private queryService!: EventQueryServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<EventQueryServiceClient>(
      EVENT_QUERY_SERVICE_NAME,
    );
  }

  @ApiOperation({
    summary: 'Search events with filters',
    description: 'Returns a paginated list of events matching search criteria.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results successfully retrieved',
    type: SearchEventsResponseDTO,
  })
  @ApiBadRequestResponse('Invalid search filters provided')
  @Get()
  searchEvents(@Query() request: SearchEventsRequestDTO) {
    this.logger.log(
      `Searching events with filters: ${JSON.stringify(request)}`,
    );
    return this.queryService
      .searchEvents(request.toQuery())
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
  @ApiNotFoundResponse('The event with the specified ID was not found')
  @Get(':id')
  getEvent(@Param('id') id: string) {
    this.logger.log(`Fetching event with id: ${id}`);
    const request = new GetEventRequestDTO();
    request.id = id;
    return this.queryService
      .getEvent(request.toQuery())
      .pipe(map((res) => GetEventResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Create a new event',
    description: 'Initializes a new event in the system.',
  })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    type: GetEventResponseDTO,
  })
  @ApiBadRequestResponse('Invalid event data provided')
  @CustomApiError(() => INVALID_DATE_PARAMETERS('startAt or endAt is invalid'))
  @Post()
  createEvent(@Body() request: CreateEventRequestDTO) {
    this.logger.log(`Creating event with title: ${request.title}`);
    return this.commandService
      .createEvent(request.toCommand())
      .pipe(map((res) => GetEventResponseDTO.fromResponse(res)));
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
  @ApiNotFoundResponse('The event with the specified ID was not found')
  @CustomApiError(() => INVALID_DATE_PARAMETERS('startAt or endAt is invalid'))
  @Patch(':id')
  updateEvent(@Param('id') id: string, @Body() request: UpdateEventRequestDTO) {
    this.logger.log(`Updating event with id: ${id}`);
    request.id = id;
    return this.commandService
      .updateEvent(request.toCommand())
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
  @Get(':id/requirements')
  listRequirements(@Param('id') id: string) {
    this.logger.log(`Listing requirements for event with id: ${id}`);
    return this.queryService.listRequirements({ eventId: id });
  }

  @ApiOperation({
    summary: 'Delete an event by ID',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: ActionSuccessResponseDTO,
  })
  @Delete(':id')
  deleteEvent(@Param('id') id: string) {
    this.logger.log(`Deleting event with id: ${id}`);
    const command: DeleteEventCommand = { id };
    return this.commandService.deleteEvent(command);
  }
}

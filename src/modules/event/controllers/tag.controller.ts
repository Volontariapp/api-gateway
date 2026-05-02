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
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiTags, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  TAG_COMMAND_SERVICE_NAME,
  TagCommandServiceClient,
  TAG_QUERY_SERVICE_NAME,
  TagQueryServiceClient,
  DeleteTagCommand,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  CreateTagRequestDTO,
  UpdateTagRequestDTO,
  GetTagsRequestDTO,
} from '../dto/request/index.js';
import {
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  GetTagsResponseDTO,
  ActionSuccessResponseDTO,
} from '../dto/response/index.js';

@ApiTags('Tags')
@ApiExtraModels(
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  GetTagsResponseDTO,
  ActionSuccessResponseDTO,
)
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiForbiddenResponse('You do not have permission to perform this action')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('tags')
export class TagController implements OnModuleInit {
  private readonly logger = new Logger({
    context: TagController.name,
  });
  private commandService!: TagCommandServiceClient;
  private queryService!: TagQueryServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<TagCommandServiceClient>(TAG_COMMAND_SERVICE_NAME);
    this.queryService = this.client.getService<TagQueryServiceClient>(TAG_QUERY_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    type: GetTagsResponseDTO,
  })
  @Get()
  getTags(@Query() request: GetTagsRequestDTO) {
    this.logger.log('Fetching tags');
    return this.queryService.getTags(request.toQuery());
  }

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    type: CreateTagResponseDTO,
  })
  @ApiConflictResponse('A tag with this label already exists')
  @Post()
  createTag(@Body() request: CreateTagRequestDTO) {
    this.logger.log('Creating tag');
    return this.commandService.createTag(request.toCommand());
  }

  @ApiOperation({ summary: 'Update a tag by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: UpdateTagResponseDTO,
  })
  @ApiNotFoundResponse('The tag with the specified ID was not found')
  @Patch(':id')
  updateTag(@Param('id') id: string, @Body() request: UpdateTagRequestDTO) {
    this.logger.log(`Updating tag with id: ${id}`);
    request.id = id;
    return this.commandService.updateTag(request.toCommand());
  }

  @ApiOperation({ summary: 'Delete a tag by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @Delete(':id')
  deleteTag(@Param('id') id: string) {
    this.logger.log(`Deleting tag with id: ${id}`);
    const command: DeleteTagCommand = { id };
    return this.commandService.deleteTag(command);
  }
}

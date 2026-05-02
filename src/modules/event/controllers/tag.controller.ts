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
  Req,
} from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import type { Metadata } from '@grpc/grpc-js';
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
  ApiConflictResponse,
  MISSING_ACCESS_TOKEN,
  CustomApiError,
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
import { WithMetadata } from '../../../common/types/grpc.types.js';

@ApiTags('Tags')
@ApiExtraModels(
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  GetTagsResponseDTO,
  ActionSuccessResponseDTO,
)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('tags')
export class TagController implements OnModuleInit {
  private readonly logger = new Logger({
    context: TagController.name,
  });
  private commandService!: WithMetadata<TagCommandServiceClient>;
  private queryService!: WithMetadata<TagQueryServiceClient>;

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
  getTags(@Query() request: GetTagsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Fetching tags');
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getTags(request.toQuery(), metadata);
  }

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    type: CreateTagResponseDTO,
  })
  @ApiConflictResponse('A tag with this label already exists')
  @Post()
  createTag(@Body() request: CreateTagRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Creating tag');
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.createTag(request.toCommand(), metadata);
  }

  @ApiOperation({ summary: 'Update a tag by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: UpdateTagResponseDTO,
  })
  @Patch(':id')
  updateTag(
    @Param('id') id: string,
    @Body() request: UpdateTagRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating tag with id: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.updateTag(request.toCommand(), metadata);
  }

  @ApiOperation({ summary: 'Delete a tag by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @Delete(':id')
  deleteTag(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting tag with id: ${id}`);
    const command: DeleteTagCommand = { id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.deleteTag(command, metadata);
  }
}

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
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  POST_SERVICE_NAME,
  PostServiceClient,
  DeletePostCommand,
  PostQuery,
} from '@volontariapp/contracts-nest';
import { POST_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  CreatePostRequestDTO,
  UpdatePostRequestDTO,
  ListPostsRequestDTO,
} from '../dto/request/index.js';
import { PostResponseDTO, ListPostsResponseDTO } from '../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../event/dto/response/index.js';

@ApiTags('Posts')
@ApiExtraModels(PostResponseDTO, ListPostsResponseDTO, ActionSuccessResponseDTO)
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiForbiddenResponse('You do not have permission to manage posts')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('posts')
export class PostController implements OnModuleInit {
  private readonly logger = new Logger({ context: PostController.name });
  private postService!: PostServiceClient;

  constructor(@Inject(POST_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.postService = this.client.getService<PostServiceClient>(POST_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all posts' })
  @ApiResponse({ status: 200, type: ListPostsResponseDTO })
  @Get()
  listPosts(@Query() request: ListPostsRequestDTO) {
    this.logger.log('Listing posts');
    return this.postService.listPosts(request.toQuery());
  }

  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Get(':id')
  getPost(@Param('id') id: string) {
    this.logger.log(`Fetching post: ${id}`);
    const query: PostQuery = { id };
    return this.postService.getPost(query);
  }

  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, type: PostResponseDTO })
  @Post()
  createPost(@Body() request: CreatePostRequestDTO) {
    this.logger.log(`Creating post by author: ${request.authorId}`);
    return this.postService.createPost(request.toCommand());
  }

  @ApiOperation({ summary: 'Update a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Patch(':id')
  updatePost(@Param('id') id: string, @Body() request: UpdatePostRequestDTO) {
    this.logger.log(`Updating post: ${id}`);
    request.id = id;
    return this.postService.updatePost(request.toCommand());
  }

  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Delete(':id')
  deletePost(@Param('id') id: string) {
    this.logger.log(`Deleting post: ${id}`);
    const command: DeletePostCommand = { id };
    return this.postService.deletePost(command);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';

import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  ApiUnauthorizedResponse,
} from '@volontariapp/errors-nest';
import {
  POST_SERVICE_NAME,
  PostServiceClient,
  DeletePostCommand,
} from '@volontariapp/contracts-nest';
import {
  CreatePostRequestDTO,
  UpdatePostRequestDTO,
  ListPostsRequestDTO,
  GetPostRequestDTO,
} from '../dto/request/index.js';
import { PostResponseDTO, ListPostsResponseDTO } from '../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../event/dto/response/index.js';
import type { Metadata } from '@grpc/grpc-js';
import { BasePostGrpcController } from './base-post-grpc.controller.js';
import { GatewayController } from '../../../common/decorators/gateway-controller.decorator.js';
import { map } from 'rxjs';
import { GetPostResponseDTO } from '../dto/response/get-post.response.dto.js';

@ApiTags('Posts')
@ApiExtraModels(PostResponseDTO, ListPostsResponseDTO, ActionSuccessResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage posts')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController(`Post`)
@Controller('posts')
export class PostController extends BasePostGrpcController {
  private readonly logger = new Logger({ context: PostController.name });
  onModuleInit() {
    this.postService = this.client.getService<PostServiceClient>(POST_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all posts' })
  @ApiResponse({ status: 200, type: ListPostsResponseDTO })
  @Get()
  listPosts(@Query() request: ListPostsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing posts');

    const metadata = req['internalMetadata'] as Metadata;

    return this.postService
      .listPosts(request.toQuery(), metadata)
      .pipe(map((res) => ListPostsResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Get(':id')
  getPost(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching post with id: ${id}`);
    const request = new GetPostRequestDTO();
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.postService
      .getPost(request.toQuery(), metadata)
      .pipe(map((res) => GetPostResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, type: PostResponseDTO })
  @Post()
  createPost(
    @CurrentUser() user: AuthUser,
    @Body() request: CreatePostRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Creating post by author: ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    const response = this.postService.createPost(request.toCommand(), metadata);
    this.logger.log(`response: ${JSON.stringify(response)}`);
    return response;
  }

  @ApiOperation({ summary: 'Update a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body() request: UpdatePostRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating post: ${id}`);

    request.id = id;

    const metadata = req['internalMetadata'] as Metadata;

    return this.postService
      .updatePost(request.toCommand(), metadata)
      .pipe(map((res) => PostResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @ApiNotFoundResponse('PostDTO not found')
  @Delete(':id')
  deletePost(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting post: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    const command: DeletePostCommand = { id };

    return this.postService
      .deletePost(command, metadata)
      .pipe(map((res) => ActionSuccessResponseDTO.fromResponse(res)));
  }
}

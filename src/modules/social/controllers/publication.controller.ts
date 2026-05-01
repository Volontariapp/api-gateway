import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
  Req,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  PUBLICATION_COMMAND_SERVICE_NAME,
  PublicationCommandServiceClient,
  PUBLICATION_QUERY_SERVICE_NAME,
  PublicationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import {
  ActionSuccessResponseDTO,
  ExistsResponseDTO,
  IdsListResponseDTO,
} from '../dto/response/index.js';
import { GetFeedRequestDTO, GetUserPostsRequestDTO } from '../dto/request/index.js';
import {
  CustomApiError,
  SOCIAL_POST_ALREADY_EXISTS,
  SOCIAL_POST_NOT_FOUND,
  DATABASE_ERROR,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Publications')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('social')
export class PublicationController implements OnModuleInit {
  private commandService!: WithMetadata<PublicationCommandServiceClient>;
  private queryService!: WithMetadata<PublicationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<PublicationCommandServiceClient>(
      PUBLICATION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<PublicationQueryServiceClient>(
      PUBLICATION_QUERY_SERVICE_NAME,
    );
  }

  @Post('posts/:postId')
  @ApiOperation({ summary: 'Create a social post node' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_POST_ALREADY_EXISTS('postId'))
  @CustomApiError(() => DATABASE_ERROR('creating social post node', 'details'))
  createPostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createPostNode({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post node created' })));
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Check if post node exists' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social post existence', 'details'))
  getPostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getPostNode({ postId }, metadata);
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Delete a social post node' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_POST_NOT_FOUND('postId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social post node', 'details'))
  deletePostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deletePostNode({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post node deleted' })));
  }

  @Post('users/:userId/posts/:postId/own')
  @ApiOperation({ summary: 'Link a user as owner of a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('creating post ownership', 'details'))
  ownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .postUserOwn({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Ownership linked' })));
  }

  @Delete('users/:userId/posts/:postId/own')
  @ApiOperation({ summary: 'Unlink a user from owning a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('deleting post ownership', 'details'))
  disownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .deleteUserOwn({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Ownership unlinked' })));
  }

  @Get('users/:userId/posts')
  @ApiOperation({ summary: 'Get posts from a specific user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user posts', 'details'))
  getUserPosts(@Param('userId') userId: string, @Query() query: GetUserPostsRequestDTO) {
    query.userId = userId;
    return this.queryService.getUserPosts(query.toQuery());
  }

  @Get('users/:userId/feed')
  @ApiOperation({ summary: 'Get social feed for a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user feed', 'details'))
  getFeed(@Param('userId') userId: string, @Query() query: GetFeedRequestDTO) {
    query.userId = userId;
    return this.queryService.getFeed(query.toQuery());
  }
}

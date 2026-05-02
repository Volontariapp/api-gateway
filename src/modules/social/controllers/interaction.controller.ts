import { Controller, Post, Get, Delete, Param, Inject, OnModuleInit, Query } from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  INTERACTION_COMMAND_SERVICE_NAME,
  InteractionCommandServiceClient,
  INTERACTION_QUERY_SERVICE_NAME,
  InteractionQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { ActionSuccessResponseDTO, IdsListResponseDTO } from '../dto/response/index.js';
import { GetUserLikesRequestDTO, GetPostLikersRequestDTO } from '../dto/request/index.js';
import {
  CustomApiError,
  SOCIAL_RELATIONSHIP_ALREADY_EXISTS,
  SOCIAL_RELATIONSHIP_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Interactions')
@Controller('social')
export class InteractionController implements OnModuleInit {
  private commandService!: InteractionCommandServiceClient;
  private queryService!: InteractionQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<InteractionCommandServiceClient>(
      INTERACTION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<InteractionQueryServiceClient>(
      INTERACTION_QUERY_SERVICE_NAME,
    );
  }

  @Post('users/:userId/likes/:postId')
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'postId', 'LIKE'))
  @CustomApiError(() => DATABASE_ERROR('creating like', 'details'))
  likePost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .postLikePost({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Post liked' })));
  }

  @Delete('users/:userId/likes/:postId')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'postId', 'LIKE'))
  @CustomApiError(() => DATABASE_ERROR('deleting like', 'details'))
  unlikePost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .deleteLikePost({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Post unliked' })));
  }

  @Get('users/:userId/likes')
  @ApiOperation({ summary: 'Get list of posts liked by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikes(@Param('userId') userId: string, @Query() query: GetUserLikesRequestDTO) {
    query.userId = userId;
    return this.queryService.getUserLikes(query.toQuery());
  }

  @Get('posts/:postId/likers')
  @ApiOperation({ summary: 'Get list of users who liked a post' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching post likers', 'details'))
  getPostLikers(@Param('postId') postId: string, @Query() query: GetPostLikersRequestDTO) {
    query.postId = postId;
    return this.queryService.getPostLikers(query.toQuery());
  }
}

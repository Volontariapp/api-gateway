import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
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
import {
  GetFeedRequestDTO,
  GetUserPostsRequestDTO,
} from '../dto/request/index.js';

@ApiTags('Social - Publications')
@Controller('social')
export class PublicationController implements OnModuleInit {
  private commandService!: PublicationCommandServiceClient;
  private queryService!: PublicationQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService =
      this.client.getService<PublicationCommandServiceClient>(
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
  createPostNode(@Param('postId') postId: string) {
    return this.commandService.createPostNode({ postId });
  }

  @Get('posts/:postId')
  @ApiOperation({ summary: 'Check if post node exists' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  getPostNode(@Param('postId') postId: string) {
    return this.queryService.getPostNode({ postId });
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Delete a social post node' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  deletePostNode(@Param('postId') postId: string) {
    return this.commandService.deletePostNode({ postId });
  }

  @Post('users/:userId/posts/:postId/own')
  @ApiOperation({ summary: 'Link a user as owner of a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  ownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService.postUserOwn({ userId, postId });
  }

  @Delete('users/:userId/posts/:postId/own')
  @ApiOperation({ summary: 'Unlink a user from owning a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  disownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService.deleteUserOwn({ userId, postId });
  }

  @Get('users/:userId/posts')
  @ApiOperation({ summary: 'Get posts from a specific user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  getUserPosts(
    @Param('userId') userId: string,
    @Query() query: GetUserPostsRequestDTO,
  ) {
    query.userId = userId;
    return this.queryService.getUserPosts(query.toQuery());
  }

  @Get('users/:userId/feed')
  @ApiOperation({ summary: 'Get social feed for a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  getFeed(@Param('userId') userId: string, @Query() query: GetFeedRequestDTO) {
    query.userId = userId;
    return this.queryService.getFeed(query.toQuery());
  }
}

import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BasePublicationGrpcController } from '../base-grpc.controller.js';
import { GetFeedRequestDTO, GetUserPostsRequestDTO } from '../../dto/request/index.js';
import { ExistsResponseDTO, IdsListResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Publications - Queries')
@Controller('social')
export class PublicationQueryController extends BasePublicationGrpcController {
  @Get('posts/:postId')
  @ApiOperation({ summary: 'Check if post node exists' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social post existence', 'details'))
  getPostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getPostNode({ postId }, metadata);
  }

  @Get('users/:userId/posts')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get posts from a specific user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user posts', 'details'))
  getUserPosts(@Param('userId') userId: string, @Query() query: GetUserPostsRequestDTO) {
    query.userId = userId;
    return this.queryService.getUserPosts(query.toQuery());
  }

  @Get('users/:userId/feed')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get social feed for a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user feed', 'details'))
  getFeed(@Param('userId') userId: string, @Query() query: GetFeedRequestDTO) {
    query.userId = userId;
    return this.queryService.getFeed(query.toQuery());
  }

  @Get('posts/me')
  @ApiOperation({ summary: 'Get posts from current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user posts', 'details'))
  getUserPostsSelf(@Query() query: GetUserPostsRequestDTO, @CurrentUser() user: AuthUser) {
    query.userId = user.id;
    return this.queryService.getUserPosts(query.toQuery());
  }

  @Get('feed/me')
  @ApiOperation({ summary: 'Get social feed for current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user feed', 'details'))
  getFeedSelf(@Query() query: GetFeedRequestDTO, @CurrentUser() user: AuthUser) {
    query.userId = user.id;
    return this.queryService.getFeed(query.toQuery());
  }
}

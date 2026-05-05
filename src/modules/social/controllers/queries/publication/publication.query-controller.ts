import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BasePublicationGrpcController } from '../../base-grpc.controller.js';
import { GetFeedRequestDTO, GetUserPostsRequestDTO } from '../../../dto/request/index.js';
import { ExistsResponseDTO, IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Publications - Queries')
@Controller('social')
export class PublicationQueryController extends BasePublicationGrpcController {
  @Get('posts/me')
  @ApiOperation({ summary: 'Get posts from current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user posts', 'details'))
  getUserPostsSelf(@Query() query: GetUserPostsRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserPosts({ pagination }, metadata);
  }

  @Get('feed/me')
  @ApiOperation({ summary: 'Get social feed for current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user feed', 'details'))
  getFeedSelf(@Query() query: GetFeedRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getFeed({ pagination }, metadata);
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
}

import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseInteractionGrpcController } from '../../base-grpc.controller.js';
import { GetUserLikesRequestDTO } from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Interactions - Queries')
@Controller('social')
export class InteractionQueryController extends BaseInteractionGrpcController {
  @Get('likes')
  @ApiOperation({ summary: 'Get list of posts liked by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikesSelf(@Query() query: GetUserLikesRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserLikes({ pagination }, metadata);
  }

  @Get('posts/:postId/likers')
  @ApiOperation({ summary: 'Get list of users who liked a post' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching post likers', 'details'))
  getPostLikers(
    @Param('postId') postId: string,
    @Query() query: GetUserLikesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getPostLikers({ postId, pagination }, metadata);
  }
}

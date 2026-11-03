import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseInteractionGrpcController } from '../../base-grpc.controller.js';
import {
  GetMyLikesRequestDTO,
  GetPostsLikeSummaryRequestDTO,
  GetUserLikesRequestDTO,
} from '../../../dto/request/index.js';
import { IdsListResponseDTO, PostsLikeSummaryResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Interactions - Queries')
@Controller('social')
export class InteractionQueryController extends BaseInteractionGrpcController {
  @Get('likes')
  @ApiOperation({ summary: 'Get list of posts liked by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikesSelf(@Query() query: GetMyLikesRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getUserLikes({ pagination }, metadata);
  }

  /**
   * Route de LECTURE exposee en POST pour eviter une URL de 100 identifiants. Le premier segment
   * est volontairement distinct de likes/:postId et posts/:postId (POST existants): une route
   * statique sous ces prefixes dependrait de l'ordre d'enregistrement des controleurs.
   */
  @Post('likes-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get like count and liked-by-me flag for several posts',
    description:
      'Read-only batch lookup, exposed as POST only to avoid a URL carrying up to 100 ids. Returns one entry per requested post id; likedByMe refers to the current user.',
  })
  @ApiResponse({ status: 200, type: PostsLikeSummaryResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching posts like summary', 'details'))
  getPostsLikeSummarySelf(
    @Body() body: GetPostsLikeSummaryRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getPostsLikeSummary(body.toQuery(), metadata);
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

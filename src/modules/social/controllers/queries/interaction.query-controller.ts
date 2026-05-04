import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CustomApiError,
  DATABASE_ERROR,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { AccessTokenGuard } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseInteractionGrpcController } from '../base-grpc.controller.js';
import { GetUserLikesRequestDTO } from '../../dto/request/index.js';
import { IdsListResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Interactions - Queries')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Access denied')
@Controller('social')
@UseGuards(AccessTokenGuard)
export class InteractionQueryController extends BaseInteractionGrpcController {
  @Get('users/:userId/likes')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of posts liked by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikes(
    @Param('userId') userId: string,
    @Query() query: GetUserLikesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetUserLikes({ userId, pagination }, metadata);
  }

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

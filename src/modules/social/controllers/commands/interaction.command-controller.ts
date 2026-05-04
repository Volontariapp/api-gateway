import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_RELATIONSHIP_ALREADY_EXISTS,
  SOCIAL_RELATIONSHIP_NOT_FOUND,
  DATABASE_ERROR,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { AccessTokenGuard } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseInteractionGrpcController } from '../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Interactions - Commands')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Access denied')
@Controller('social')
@UseGuards(AccessTokenGuard)
export class InteractionCommandController extends BaseInteractionGrpcController {
  @Post('users/:userId/likes/:postId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'postId', 'LIKE'))
  @CustomApiError(() => DATABASE_ERROR('creating like', 'details'))
  likePost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminPostLikePost({ userId, postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post liked' })));
  }

  @Delete('users/:userId/likes/:postId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'postId', 'LIKE'))
  @CustomApiError(() => DATABASE_ERROR('deleting like', 'details'))
  unlikePost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminDeleteLikePost({ userId, postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post unliked' })));
  }

  @Post('likes/:postId')
  @ApiOperation({ summary: 'Like a post (self)' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('creating like', 'details'))
  likePostSelf(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postLikePost({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post liked' })));
  }

  @Delete('likes/:postId')
  @ApiOperation({ summary: 'Unlike a post (self)' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('deleting like', 'details'))
  unlikePostSelf(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteLikePost({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post unliked' })));
  }
}

import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_RELATIONSHIP_ALREADY_EXISTS,
  SOCIAL_RELATIONSHIP_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseInteractionGrpcController } from '../../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Interactions - Admin', { admin: true })
@Controller('social')
export class InteractionAdminCommandController extends BaseInteractionGrpcController {
  @Post('users/:userId/likes/:postId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Like a post (Admin)' })
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
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unlike a post (Admin)' })
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
}

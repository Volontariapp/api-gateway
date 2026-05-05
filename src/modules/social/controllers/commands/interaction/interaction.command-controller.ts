import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseInteractionGrpcController } from '../../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Interactions - Commands')
@Controller('social')
export class InteractionCommandController extends BaseInteractionGrpcController {
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

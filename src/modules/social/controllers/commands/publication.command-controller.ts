import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_POST_ALREADY_EXISTS,
  SOCIAL_POST_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { BasePublicationGrpcController } from '../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Publications - Commands')
@Controller('social')
export class PublicationCommandController extends BasePublicationGrpcController {
  @Post('posts/:postId')
  @ApiOperation({ summary: 'Create a social post node' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_POST_ALREADY_EXISTS('postId'))
  @CustomApiError(() => DATABASE_ERROR('creating social post node', 'details'))
  createPostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createPostNode({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post node created' })));
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: 'Delete a social post node' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_POST_NOT_FOUND('postId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social post node', 'details'))
  deletePostNode(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deletePostNode({ postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post node deleted' })));
  }

  @Post('users/:userId/posts/:postId/own')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Link a user as owner of a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('creating post ownership', 'details'))
  ownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .postUserOwn({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Ownership linked' })));
  }

  @Delete('users/:userId/posts/:postId/own')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unlink a user from owning a post' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('deleting post ownership', 'details'))
  disownPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.commandService
      .deleteUserOwn({ userId, postId })
      .pipe(map(() => ({ success: true, message: 'Ownership unlinked' })));
  }
}

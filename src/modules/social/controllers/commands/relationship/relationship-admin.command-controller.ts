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
import { BaseRelationshipGrpcController } from '../../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Relationships - Admin', { admin: true })
@Controller('social')
export class RelationshipAdminCommandController extends BaseRelationshipGrpcController {
  @Post('users/:userId/follow/:followedId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Follow a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-follower' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('creating follow relationship', 'details'))
  follow(
    @Param('userId') userId: string,
    @Param('followedId') followedId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminPostFollowUser({ followerId: userId, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Followed successfully' })));
  }

  @Delete('users/:userId/follow/:followedId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unfollow a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-follower' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('deleting follow relationship', 'details'))
  unfollow(
    @Param('userId') userId: string,
    @Param('followedId') followedId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminDeleteFollowUser({ followerId: userId, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unfollowed successfully' })));
  }

  @Post('users/:userId/block/:blockedId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Block a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-blocker' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('creating block relationship', 'details'))
  block(
    @Param('userId') userId: string,
    @Param('blockedId') blockedId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminPostBlockUser({ blockerId: userId, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Blocked successfully' })));
  }

  @Delete('users/:userId/block/:blockedId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unblock a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-blocker' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('deleting block relationship', 'details'))
  unblock(
    @Param('userId') userId: string,
    @Param('blockedId') blockedId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .adminDeleteBlockUser({ blockerId: userId, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unblocked successfully' })));
  }
}

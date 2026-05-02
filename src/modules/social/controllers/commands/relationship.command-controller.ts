import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CustomApiError,
  SOCIAL_RELATIONSHIP_ALREADY_EXISTS,
  SOCIAL_RELATIONSHIP_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseRelationshipGrpcController } from '../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Relationships - Commands')
@Controller('social')
export class RelationshipCommandController extends BaseRelationshipGrpcController {
  @Post('users/:userId/follow/:followedId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Follow a user' })
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
      .postFollowUser({ followerId: userId, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Followed successfully' })));
  }

  @Delete('users/:userId/follow/:followedId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Unfollow a user' })
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
      .deleteFollowUser({ followerId: userId, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unfollowed successfully' })));
  }

  @Post('users/:userId/block/:blockedId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Block a user' })
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
      .postBlockUser({ blockerId: userId, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Blocked successfully' })));
  }

  @Delete('users/:userId/block/:blockedId')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Unblock a user' })
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
      .deleteBlockUser({ blockerId: userId, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unblocked successfully' })));
  }

  @Post('follow/:followedId')
  @ApiOperation({ summary: 'Follow a user (self)' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('creating follow relationship', 'details'))
  followSelf(
    @Param('followedId') followedId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postFollowUser({ followerId: user.id, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Followed successfully' })));
  }

  @Delete('follow/:followedId')
  @ApiOperation({ summary: 'Unfollow a user (self)' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('deleting follow relationship', 'details'))
  unfollowSelf(
    @Param('followedId') followedId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteFollowUser({ followerId: user.id, followedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unfollowed successfully' })));
  }

  @Post('block/:blockedId')
  @ApiOperation({ summary: 'Block a user (self)' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('creating block relationship', 'details'))
  blockSelf(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .postBlockUser({ blockerId: user.id, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Blocked successfully' })));
  }

  @Delete('block/:blockedId')
  @ApiOperation({ summary: 'Unblock a user (self)' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('deleting block relationship', 'details'))
  unblockSelf(
    @Param('blockedId') blockedId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteBlockUser({ blockerId: user.id, blockedId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Unblocked successfully' })));
  }
}

import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseRelationshipGrpcController } from '../../base-grpc.controller.js';
import { GetMyBlocksRequestDTO, GetWhoBlockedMeRequestDTO } from '../../../dto/request/index.js';
import { IdsListResponseDTO, IsFollowingResponseDTO } from '../../../dto/response/index.js';
import { map } from 'rxjs';

@GatewayController('Social - Relationships - Admin Queries', { admin: true })
@Controller('social')
export class RelationshipAdminQueryController extends BaseRelationshipGrpcController {
  @Get('users/:userId/blocks')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get list of blocked users (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching blocks', 'details'))
  getBlocks(
    @Param('userId') userId: string,
    @Query() query: GetMyBlocksRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetMyBlocks({ userId, pagination }, metadata);
  }

  @Get('users/:userId/who-blocked-me')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get list of users who blocked this user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching who blocked me', 'details'))
  getWhoBlockedMe(
    @Param('userId') userId: string,
    @Query() query: GetWhoBlockedMeRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetWhoBlockedMe({ userId, pagination }, metadata);
  }

  @Get('users/:followerId/is-following/:followedId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Check if a user is following another user (Admin)' })
  @ApiParam({ name: 'followerId', example: 'uuid-follower' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 200, type: IsFollowingResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching is following status', 'details'))
  getIsFollowing(
    @Param('followerId') followerId: string,
    @Param('followedId') followedId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService
      .adminGetIsFollowing({ followerId, followedId }, metadata)
      .pipe(map((res) => IsFollowingResponseDTO.fromResponse(res)));
  }
}

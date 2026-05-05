import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseRelationshipGrpcController } from '../../base-grpc.controller.js';
import {
  GetMyFollowsRequestDTO,
  GetMyFollowersRequestDTO,
  GetMyBlocksRequestDTO,
  GetWhoBlockedMeRequestDTO,
} from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Relationships - Admin Queries', { admin: true })
@Controller('social')
export class RelationshipAdminQueryController extends BaseRelationshipGrpcController {
  @Get('users/:userId/follows')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get list of users followed by this user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching follows', 'details'))
  getFollows(
    @Param('userId') userId: string,
    @Query() query: GetMyFollowsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetMyFollows({ userId, pagination }, metadata);
  }

  @Get('users/:userId/followers')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get list of users following this user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching followers', 'details'))
  getFollowers(
    @Param('userId') userId: string,
    @Query() query: GetMyFollowersRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetMyFollowers({ userId, pagination }, metadata);
  }

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
}

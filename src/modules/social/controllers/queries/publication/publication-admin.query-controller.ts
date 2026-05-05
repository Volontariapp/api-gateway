import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BasePublicationGrpcController } from '../../base-grpc.controller.js';
import { GetFeedRequestDTO, GetUserPostsRequestDTO } from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Publications - Admin Queries', { admin: true })
@Controller('social')
export class PublicationAdminQueryController extends BasePublicationGrpcController {
  @Get('users/:userId/posts')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get posts from a specific user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user posts', 'details'))
  getUserPosts(
    @Param('userId') userId: string,
    @Query() query: GetUserPostsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetUserPosts({ userId, pagination }, metadata);
  }

  @Get('users/:userId/feed')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get social feed for a user (Admin)' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user feed', 'details'))
  getFeed(
    @Param('userId') userId: string,
    @Query() query: GetFeedRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.adminGetFeed({ userId, pagination }, metadata);
  }
}

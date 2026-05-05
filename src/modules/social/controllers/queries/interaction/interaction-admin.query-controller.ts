import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseInteractionGrpcController } from '../../base-grpc.controller.js';
import { GetUserLikesRequestDTO } from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Interactions - Admin Queries', { admin: true })
@Controller('social')
export class InteractionAdminQueryController extends BaseInteractionGrpcController {
  @Get('users/:userId/likes')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Get list of posts liked by a user (Admin)' })
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
}

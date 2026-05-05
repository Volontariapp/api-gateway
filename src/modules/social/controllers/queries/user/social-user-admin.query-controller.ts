import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserRoles } from '@volontariapp/shared';
import type { Metadata } from '@grpc/grpc-js';
import { BaseSocialUserGrpcController } from '../../base-grpc.controller.js';
import { ExistsResponseDTO } from '../../../dto/response/index.js';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { Roles } from '@volontariapp/auth';

@GatewayController('Social - User Nodes - Admin Queries', { admin: true })
@Controller('social/users')
export class SocialUserAdminQueryController extends BaseSocialUserGrpcController {
  @Get(':userId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({
    summary: 'Check if user node exists (Admin)',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nVerify whether a user has been initialized in the social graph.',
  })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social user existence', 'details'))
  getUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserNode({ userId }, metadata);
  }
}

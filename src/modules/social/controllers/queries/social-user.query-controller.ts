import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import type { Metadata } from '@grpc/grpc-js';
import { BaseSocialUserGrpcController } from '../base-grpc.controller.js';
import { ExistsResponseDTO } from '../../dto/response/index.js';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';

@ApiTags('Social - Users - Queries')
@Controller('social/users')
export class SocialUserQueryController extends BaseSocialUserGrpcController {
  @Get(':userId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Check if user node exists' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social user existence', 'details'))
  getUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserNode({ userId }, metadata);
  }
}

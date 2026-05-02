import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import type { Metadata } from '@grpc/grpc-js';
import { BaseSocialUserGrpcController } from '../base-grpc.controller.js';
import { ActionSuccessResponseDTO } from '../../dto/response/index.js';
import {
  CustomApiError,
  SOCIAL_USER_ALREADY_EXISTS,
  SOCIAL_USER_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Users - Commands')
@Controller('social/users')
export class SocialUserCommandController extends BaseSocialUserGrpcController {
  @Post(':userId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Create a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_USER_ALREADY_EXISTS('userId'))
  @CustomApiError(() => DATABASE_ERROR('creating social user node', 'details'))
  createUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createUserNode({ userId }, metadata)
      .pipe(map(() => ({ success: true, message: 'User node created' })));
  }

  @Delete(':userId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Delete a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_USER_NOT_FOUND('userId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social user node', 'details'))
  deleteUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserNode({ userId }, metadata)
      .pipe(map(() => ({ success: true, message: 'User node deleted' })));
  }
}

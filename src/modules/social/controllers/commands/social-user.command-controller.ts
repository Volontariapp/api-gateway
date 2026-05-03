import { map } from 'rxjs';
import { Controller, Delete, Param, Post, Req } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Users - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('social/users')
export class SocialUserCommandController extends BaseSocialUserGrpcController {
  @Post(':userId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({
    summary: 'Create a social user node',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nInitialize a new user node in the social graph. This must be done before the user can participate in social interactions.',
  })
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
  @ApiOperation({
    summary: 'Delete a social user node',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nRemove a user node from the social graph. This will cascade and remove all related relationships (posts, events, participations).',
  })
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

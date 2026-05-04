import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles, AccessTokenGuard, RolesGuard } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { UseGuards } from '@nestjs/common';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { ListUsersRequestDTO } from '../../dto/request/index.js';
import { ListUsersResponseDTO, UserResponseDTO } from '../../dto/response/index.js';
import { AdminGetUserQuery } from '@volontariapp/contracts-nest';

@ApiTags('Users - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('users')
@UseGuards(AccessTokenGuard, RolesGuard)
export class UserAdminQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserAdminQueryController.name });

  @ApiOperation({
    summary: 'List all users',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nFetch a paginated list of all users in the system. Requires a valid **access-token** JWT with the `admin` role.',
  })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @Roles(UserRoles.ADMIN)
  @Get()
  listUsers(@Query() request: ListUsersRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing users');
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .listUsers(request.toQuery(), metadata)
      .pipe(map((res) => ListUsersResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Get a user by ID (Admin)',
    description: '🔐 **Required Role:** `ADMIN`\n\nFetch any user profile by its unique ID.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Roles(UserRoles.ADMIN)
  @Get(':id')
  getUser(@Param('id') userId: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Admin fetching user profile: ${userId}`);
    const query: AdminGetUserQuery = { userId };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .adminGetUser(query, metadata)
      .pipe(map((res) => UserResponseDTO.fromResponse(res)));
  }
}

import { Body, Controller, Delete, Param, Patch, Post, Req } from '@nestjs/common';
import { map, switchMap } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
  BADGE_NOT_FOUND,
  USER_ALREADY_HAS_BADGE,
  USER_BADGE_NOT_FOUND,
  INVALID_SCORE_INCREMENT,
  INVALID_RNA,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles, AccessTokenGuard, RolesGuard } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { UseGuards } from '@nestjs/common';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import {
  AddBadgeToUserRequestDTO,
  IncrementImpactScoreRequestDTO,
  RemoveBadgeFromUserRequestDTO,
  UpdateUserRequestDTO,
} from '../../dto/request/index.js';
import { UserResponseDTO } from '../../dto/response/index.js';
import {
  AdminUpdateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserQuery,
} from '@volontariapp/contracts-nest';

@ApiTags('Users - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('users')
@UseGuards(AccessTokenGuard, RolesGuard)
export class UserAdminCommandController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserAdminCommandController.name });

  @ApiOperation({
    summary: 'Update a user by ID (Admin)',
    description: '🔐 **Required Role:** `ADMIN`\n\nUpdate any user profile information.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_RNA(''))
  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  updateUser(
    @Param('id') userId: string,
    @Body() request: UpdateUserRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Admin updating user profile: ${userId}`);
    const command: AdminUpdateUserCommand = {
      userId,
      ...request.toCommand(),
    };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.adminUpdateUser(command, metadata).pipe(
      switchMap(() => {
        const query: AdminGetUserQuery = { userId };
        return this.userService.adminGetUser(query, metadata);
      }),
      map((res) => UserResponseDTO.fromResponse(res)),
    );
  }

  @ApiOperation({
    summary: 'Delete a user by ID (Admin)',
    description: '🔐 **Required Role:** `ADMIN`\n\nPermanently delete a user account.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Roles(UserRoles.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') userId: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Admin deleting user account: ${userId}`);
    const command: AdminDeleteUserCommand = { userId };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.adminDeleteUser(command, metadata);
  }

  @ApiOperation({
    summary: 'Add a badge to a user',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nAssign a badge to a user. Requires the user and badge to exist. User cannot already have this badge.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 201 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => BADGE_NOT_FOUND(''))
  @CustomApiError(() => USER_ALREADY_HAS_BADGE('', ''))
  @Roles(UserRoles.ADMIN)
  @Post(':id/badges')
  addBadge(
    @Param('id') userId: string,
    @Body() request: AddBadgeToUserRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Adding badge ${request.badgeId} to user ${userId}`);
    request.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.addBadgeToUser(request.toCommand(), metadata);
  }

  @ApiOperation({
    summary: 'Remove a badge from a user',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nRevoke a badge from a user. The user must have the badge assigned.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiParam({ name: 'badgeId', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => USER_BADGE_NOT_FOUND('', ''))
  @Roles(UserRoles.ADMIN)
  @Delete(':id/badges/:badgeId')
  removeBadge(
    @Param('id') userId: string,
    @Param('badgeId') badgeId: string,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Removing badge ${badgeId} from user ${userId}`);
    const dto = new RemoveBadgeFromUserRequestDTO();
    dto.userId = userId;
    dto.badgeId = badgeId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.removeBadgeFromUser(dto.toCommand(), metadata);
  }

  @ApiOperation({
    summary: 'Increment impact score for a user',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nIncrease or decrease the impact score for a user. Useful for rewarding participation or correcting scores. The increment value must be non-zero.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_SCORE_INCREMENT(0))
  @Roles(UserRoles.ADMIN)
  @Post(':id/impact-score')
  incrementImpactScore(
    @Param('id') userId: string,
    @Body() request: IncrementImpactScoreRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Incrementing impact score for user ${userId}`);
    request.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.incrementImpactScore(request.toCommand(), metadata);
  }
}

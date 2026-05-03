import { Body, Controller, Delete, Param, Post, Req } from '@nestjs/common';
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
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import {
  AddBadgeToUserRequestDTO,
  IncrementImpactScoreRequestDTO,
  RemoveBadgeFromUserRequestDTO,
} from '../../dto/request/index.js';

@ApiTags('Users - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('users')
export class UserAdminCommandController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserAdminCommandController.name });

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

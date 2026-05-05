import { Body, Controller, Delete, Param, Patch, Post, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { BaseBadgeGrpcController } from '../../base-badge-grpc.controller.js';
import {
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
  DeleteBadgeRequestDTO,
} from '../../../dto/request/index.js';
import { BadgeResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Badges - Admin', {
  admin: true,
  extraModels: [BadgeResponseDTO],
})
@Controller('badges')
export class BadgeAdminCommandController extends BaseBadgeGrpcController {
  private readonly logger = new Logger({ context: BadgeAdminCommandController.name });

  @ApiOperation({
    summary: 'Create a new badge',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nCreate a new badge that can be assigned to users. Each badge must have a unique slug identifier.',
  })
  @ApiResponse({ status: 201, type: BadgeResponseDTO })
  @Roles(UserRoles.ADMIN)
  @Post()
  createBadge(@Body() request: CreateBadgeRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log(`Creating badge with slug: ${request.slug}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService
      .createBadge(request.toCommand(), metadata)
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Update a badge by ID',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nModify badge properties such as name, description, or slug.',
  })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  updateBadge(
    @Param('id') id: string,
    @Body() request: UpdateBadgeRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating badge with id: ${id}`);
    request.badgeId = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService.updateBadge(request.toCommand(), metadata);
  }

  @ApiOperation({
    summary: 'Delete a badge by ID',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nRemove a badge definition from the system. Users previously assigned this badge will no longer have it.',
  })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200 })
  @Roles(UserRoles.ADMIN)
  @Delete(':id')
  deleteBadge(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting badge with id: ${id}`);
    const dto = new DeleteBadgeRequestDTO();
    dto.badgeId = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService.deleteBadge(dto.toCommand(), metadata);
  }
}

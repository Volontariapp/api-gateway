import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { BaseBadgeGrpcController } from '../base-badge-grpc.controller.js';
import {
  ListBadgesRequestDTO,
  GetBadgeRequestDTO,
  GetBadgeBySlugRequestDTO,
} from '../../dto/request/index.js';
import { BadgeResponseDTO, ListBadgesResponseDTO } from '../../dto/response/index.js';

@ApiTags('Badges')
@ApiExtraModels(BadgeResponseDTO, ListBadgesResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage badges')
@Controller('badges')
export class BadgeQueryController extends BaseBadgeGrpcController {
  private readonly logger = new Logger({ context: BadgeQueryController.name });

  @ApiOperation({ summary: 'List all badges' })
  @ApiResponse({ status: 200, type: ListBadgesResponseDTO })
  @Get()
  listBadges(@Query() request: ListBadgesRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing all badges');
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService
      .listBadges(request.toQuery(), metadata)
      .pipe(map((res) => ListBadgesResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a badge by slug' })
  @ApiParam({ name: 'slug', example: 'volunteer' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Get(`slug/:slug`)
  getBadgeBySlug(@Param('slug') slug: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching badge with slug: ${slug}`);
    const dto = new GetBadgeBySlugRequestDTO();
    dto.slug = slug;
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService
      .getBadgeBySlug(dto.toQuery(), metadata)
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a badge by ID' })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Get(':id')
  getBadge(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching badge with id: ${id}`);
    const dto = new GetBadgeRequestDTO();
    dto.badgeId = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService
      .getBadge(dto.toQuery(), metadata)
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  BADGE_NOT_FOUND,
  BADGE_ALREADY_EXISTS,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  BADGE_SERVICE_NAME,
  BadgeServiceClient,
  DeleteBadgeCommand,
  GetBadgeQuery,
} from '@volontariapp/contracts-nest';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  CreateBadgeRequestDTO,
  UpdateBadgeRequestDTO,
} from '../dto/request/index.js';
import {
  BadgeResponseDTO,
  ListBadgesResponseDTO,
} from '../dto/response/index.js';
import { ListBadgesRequestDTO } from '../dto/request/list-badges.request.dto.js';

@ApiTags('Badges')
@ApiExtraModels(BadgeResponseDTO, ListBadgesResponseDTO)
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiForbiddenResponse('You do not have permission to manage badges')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('badges')
export class BadgeController implements OnModuleInit {
  private readonly logger = new Logger({ context: BadgeController.name });
  private badgeService!: BadgeServiceClient;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.badgeService =
      this.client.getService<BadgeServiceClient>(BADGE_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all badges' })
  @ApiResponse({ status: 200, type: ListBadgesResponseDTO })
  @Get()
  listBadges(@Query() request: ListBadgesRequestDTO) {
    this.logger.log('Listing all badges');
    return this.badgeService
      .listBadges(request.toQuery())
      .pipe(map((res) => ListBadgesResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a badge by slug' })
  @ApiParam({ name: 'slug', example: 'volunteer' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Get(`slug/:slug`)
  getBadgeBySlug(@Param('slug') slug: string) {
    this.logger.log(`Fetching badge with slug: ${slug}`);
    return this.badgeService
      .getBadgeBySlug({ slug })
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a badge by ID' })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Get(':id')
  getBadge(@Param('id') id: string) {
    this.logger.log(`Fetching badge with id: ${id}`);
    const query: GetBadgeQuery = { badgeId: id };
    return this.badgeService
      .getBadge(query)
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Create a new badge' })
  @ApiResponse({ status: 201, type: BadgeResponseDTO })
  @Post()
  createBadge(@Body() request: CreateBadgeRequestDTO) {
    this.logger.log(`Creating badge with slug: ${request.slug}`);
    return this.badgeService
      .createBadge(request.toCommand())
      .pipe(map((res) => BadgeResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Update a badge by ID' })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200, type: BadgeResponseDTO })
  @Patch(':id')
  updateBadge(@Param('id') id: string, @Body() request: UpdateBadgeRequestDTO) {
    this.logger.log(`Updating badge with id: ${id}`);
    return this.badgeService.updateBadge(request.toCommand(id));
  }

  @ApiOperation({ summary: 'Delete a badge by ID' })
  @ApiParam({ name: 'id', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  deleteBadge(@Param('id') id: string) {
    this.logger.log(`Deleting badge with id: ${id}`);
    const command: DeleteBadgeCommand = { badgeId: id };
    return this.badgeService.deleteBadge(command);
  }
}

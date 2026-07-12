import { Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import {
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@volontariapp/errors-nest';
import { SeedStatusResponse, SystemSeedService } from '../services/system-seed.service.js';
import { GatewayController } from '../../../common/decorators/gateway-controller.decorator.js';

@ApiTags('System')
@ApiBearerAuth('access-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage system as admin')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController('System')
@Controller('system')
@Roles(UserRoles.ADMIN)
export class SystemSeedController {
  constructor(private readonly seedService: SystemSeedService) {}

  @ApiOperation({ summary: 'Seed the database with fake data (500 users, etc.)' })
  @ApiResponse({ status: 201, description: 'Seeding successful' })
  @Post('seed')
  async seedDatabase(@Req() req: Record<string, unknown>): Promise<SeedStatusResponse> {
    return await this.seedService.seed(req);
  }
}

import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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
import { SystemSeedService } from '../services/system-seed.service.js';
import { GatewayController } from '../../../common/decorators/gateway-controller.decorator.js';
import { SeedOptionsDTO, SeedStatusResponseDTO } from '../common/index.js';

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

  @ApiOperation({
    summary: 'Seed the database with global ecosystem data (users, events, posts, interactions)',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nLance la génération du seed global en arrière-plan avec support des presets (quick, standard, mega-1000).',
  })
  @ApiResponse({ status: 201, description: 'Seeding successfully started' })
  @Post('seed')
  seedDatabase(
    @Req() req: { headers?: Record<string, string | string[] | undefined>; [key: string]: unknown },
    @Body() options?: SeedOptionsDTO,
  ): {
    message: string;
    options: SeedOptionsDTO;
  } {
    return this.seedService.seed(req, options);
  }

  @ApiOperation({
    summary: 'Get the last or current seed status report',
    description: '🔐 **Required Role:** `ADMIN`\n\nConsulte les métriques du dernier seed exécuté.',
  })
  @ApiResponse({ status: 200, type: SeedStatusResponseDTO, description: 'Seed status retrieved' })
  @Get('seed/status')
  getSeedStatus(): SeedStatusResponseDTO {
    return this.seedService.getLastStatus();
  }
}

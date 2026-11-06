import { Controller, Get, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { BaseBadgeGrpcController } from '../../base-badge-grpc.controller.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { GetMyBadgeProgressResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Badges', {
  extraModels: [GetMyBadgeProgressResponseDTO],
})
@Controller('users/me/badges')
export class BadgeProgressQueryController extends BaseBadgeGrpcController {
  private readonly logger = new Logger({ context: BadgeProgressQueryController.name });

  @ApiOperation({
    summary: 'Get my progress towards every badge',
    description:
      'One entry per badge of the catalogue with its points, whether it is unlocked and the progress of each requirement. The user is taken from the internal token, never from the request.',
  })
  @ApiResponse({ status: 200, type: GetMyBadgeProgressResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching badge progress', 'details'))
  @Get('progress')
  getMyBadgeProgress(@Req() req: Record<string, unknown>) {
    this.logger.log('Fetching my badge progress');
    const metadata = req['internalMetadata'] as Metadata;
    return this.badgeService
      .getMyBadgeProgress({}, metadata)
      .pipe(map((res) => GetMyBadgeProgressResponseDTO.fromResponse(res)));
  }
}

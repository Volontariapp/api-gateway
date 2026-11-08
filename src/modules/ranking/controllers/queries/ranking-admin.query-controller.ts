import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { UserRoles } from '@volontariapp/shared';
import { map, type Observable } from 'rxjs';
import { GatewayController } from '../../../../common/decorators/gateway-controller.decorator.js';
import { BaseRankingQueryGrpcController } from '../base-query-grpc.controller.js';
import { GetActiveUserLocationsRequestDTO } from '../../dto/request/index.js';
import { GetActiveUserLocationsResponseDTO } from '../../dto/response/index.js';

/**
 * Admin only (`admin: true` mounts the roles guard, `@Roles` alone does nothing). `ms-ranking`
 * checks the role again: a position is personal data.
 */
@GatewayController('Ranking - Admin', {
  admin: true,
  extraModels: [GetActiveUserLocationsResponseDTO],
})
@Controller('ranking/admin')
export class RankingAdminQueryController extends BaseRankingQueryGrpcController {
  private readonly logger = new Logger({ context: RankingAdminQueryController.name });

  @ApiOperation({
    summary: 'Positions of the users who sent one recently',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nDistinct positions rounded to 1 km, without any user identifier. Used by the traffic simulator to create events around real users.',
  })
  @ApiResponse({ status: 200, type: GetActiveUserLocationsResponseDTO })
  @Roles(UserRoles.ADMIN)
  @Get('active-locations')
  getActiveLocations(
    @Query() request: GetActiveUserLocationsRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<GetActiveUserLocationsResponseDTO> {
    this.logger.log('Reading the active position cells');
    return this.queryService
      .getActiveUserLocations(request.toQuery(), req['internalMetadata'] as Metadata)
      .pipe(map((res) => GetActiveUserLocationsResponseDTO.fromResponse(res)));
  }
}

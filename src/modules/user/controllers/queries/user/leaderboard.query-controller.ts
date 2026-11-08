import { Controller, Get, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseUserGrpcController } from '../../base-user-grpc.controller.js';
import { GetLeaderboardRequestDTO, GetMyRankRequestDTO } from '../../../dto/request/index.js';
import { GetLeaderboardResponseDTO, GetMyRankResponseDTO } from '../../../dto/response/index.js';

/**
 * Classement par points : global (tous temps), semaine et mois. Declare avant
 * UserAdminQueryController (GET /users/:id) pour que `leaderboard` ne soit pas pris pour un id.
 */
@GatewayController('Leaderboard', {
  extraModels: [GetLeaderboardResponseDTO, GetMyRankResponseDTO],
})
@Controller('users')
export class LeaderboardQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: LeaderboardQueryController.name });

  @ApiOperation({
    summary: 'Get the leaderboard',
    description:
      'Users ranked by points: global (all time), week or month. Cursor pagination: pass nextCursor back as cursor. Ties share a rank. Ranks 1 to 3 carry a distinction.',
  })
  @ApiResponse({ status: 200, type: GetLeaderboardResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching the leaderboard', 'details'))
  @Get('leaderboard')
  getLeaderboard(@Query() query: GetLeaderboardRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching the leaderboard (scope: ${query.scope ?? 'global'})`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getLeaderboard(query.toQuery(), metadata)
      .pipe(map((res) => GetLeaderboardResponseDTO.fromResponse(res, this.publicFileUrls)));
  }

  @ApiOperation({
    summary: 'Get my rank',
    description:
      'The caller rank, points and the five users above and below on the chosen scope. The user is taken from the internal token, never from the request. me is absent when the caller has no points on this scope yet.',
  })
  @ApiResponse({ status: 200, type: GetMyRankResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching my rank', 'details'))
  @Get('me/rank')
  getMyRank(@Query() query: GetMyRankRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching my rank (scope: ${query.scope ?? 'global'})`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getMyRank(query.toQuery(), metadata)
      .pipe(map((res) => GetMyRankResponseDTO.fromResponse(res, this.publicFileUrls)));
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser, type AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { map, type Observable } from 'rxjs';
import { GatewayController } from '../../../../common/decorators/gateway-controller.decorator.js';
import { BaseRankingCommandGrpcController } from '../base-grpc.controller.js';
import {
  RecordEventFeedbackRequestDTO,
  RequestRankingRefreshRequestDTO,
  UpdateUserLocationRequestDTO,
} from '../../dto/request/index.js';
import {
  RecordEventFeedbackResponseDTO,
  RequestRankingRefreshResponseDTO,
  UpdateUserLocationResponseDTO,
} from '../../dto/response/index.js';

@GatewayController('Ranking', {
  extraModels: [
    RequestRankingRefreshResponseDTO,
    UpdateUserLocationResponseDTO,
    RecordEventFeedbackResponseDTO,
  ],
})
@Controller('ranking')
export class RankingCommandController extends BaseRankingCommandGrpcController {
  private readonly logger = new Logger({ context: RankingCommandController.name });

  @ApiOperation({
    summary: 'Ask for a recompute of a ranked list',
    description:
      'Limited to 5 per minute per user, shared between events and posts. Beyond, refreshThrottled is true and nothing is recomputed (still 200).',
  })
  @ApiResponse({ status: 200, type: RequestRankingRefreshResponseDTO })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  requestRefresh(
    @Body() request: RequestRankingRefreshRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Observable<RequestRankingRefreshResponseDTO> {
    this.logger.log(`Ranking refresh of ${request.listKind} requested by user ${user.id}`);
    return this.commandService
      .requestRankingRefresh(request.toCommand(), req['internalMetadata'] as Metadata)
      .pipe(map((res) => RequestRankingRefreshResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Send the position of the device',
    description:
      'Rounded to 1 km and encrypted by ms-ranking. Limited to 1 update per minute; beyond, accepted is false.',
  })
  @ApiResponse({ status: 200, type: UpdateUserLocationResponseDTO })
  @HttpCode(HttpStatus.OK)
  @Put('location')
  updateLocation(
    @Body() request: UpdateUserLocationRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Observable<UpdateUserLocationResponseDTO> {
    this.logger.log(`Position update by user ${user.id}`);
    return this.commandService
      .updateUserLocation(request.toCommand(), req['internalMetadata'] as Metadata)
      .pipe(map((res) => UpdateUserLocationResponseDTO.fromResponse(res)));
  }

  @ApiOperation({
    summary: 'Record a batch of left swipes (PASS)',
    description: 'A passed event is left out of the ranked events for 30 days.',
  })
  @ApiResponse({ status: 200, type: RecordEventFeedbackResponseDTO })
  @HttpCode(HttpStatus.OK)
  @Post('events/feedback')
  recordEventFeedback(
    @Body() request: RecordEventFeedbackRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ): Observable<RecordEventFeedbackResponseDTO> {
    this.logger.log(
      `Recording ${String(request.items.length)} event feedback(s) for user ${user.id}`,
    );
    return this.commandService
      .recordEventFeedback(request.toCommand(), req['internalMetadata'] as Metadata)
      .pipe(map((res) => RecordEventFeedbackResponseDTO.fromResponse(res)));
  }
}

import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseInteractionGrpcController } from '../base-grpc.controller.js';
import { GetUserLikesRequestDTO } from '../../dto/request/index.js';
import { IdsListResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Interactions - Queries')
@Controller('social')
export class InteractionQueryController extends BaseInteractionGrpcController {
  @Get('users/:userId/likes')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of posts liked by a user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikes(
    @Param('userId') userId: string,
    @Query() query: GetUserLikesRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserLikes(query.toQuery(), metadata);
  }

  @Get('likes')
  @ApiOperation({ summary: 'Get list of posts liked by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user likes', 'details'))
  getUserLikesSelf(
    @Query() query: GetUserLikesRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserLikes(query.toQuery(), metadata);
  }
}

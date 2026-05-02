import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '@volontariapp/auth';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseRelationshipGrpcController } from '../base-grpc.controller.js';
import {
  GetMyFollowsRequestDTO,
  GetMyFollowersRequestDTO,
  GetMyBlocksRequestDTO,
  GetWhoBlockedMeRequestDTO,
} from '../../dto/request/index.js';
import { IdsListResponseDTO } from '../../dto/response/index.js';

@ApiTags('Social - Relationships - Queries')
@Controller('social')
export class RelationshipQueryController extends BaseRelationshipGrpcController {
  @Get('users/:userId/follows')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of users followed by this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching follows', 'details'))
  getFollows(
    @Param('userId') userId: string,
    @Query() query: GetMyFollowsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyFollows(query.toQuery(), metadata);
  }

  @Get('users/:userId/followers')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of users following this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching followers', 'details'))
  getFollowers(
    @Param('userId') userId: string,
    @Query() query: GetMyFollowersRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyFollowers(query.toQuery(), metadata);
  }

  @Get('users/:userId/blocks')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of blocked users' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching blocks', 'details'))
  getBlocks(
    @Param('userId') userId: string,
    @Query() query: GetMyBlocksRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyBlocks(query.toQuery(), metadata);
  }

  @Get('users/:userId/who-blocked-me')
  @UseGuards(IsCurrentUserOrAdminGuard)
  @ApiOperation({ summary: 'Get list of users who blocked this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching who blocked me', 'details'))
  getWhoBlockedMe(
    @Param('userId') userId: string,
    @Query() query: GetWhoBlockedMeRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getWhoBlockedMe(query.toQuery(), metadata);
  }

  @Get('follows')
  @ApiOperation({ summary: 'Get list of users followed by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching follows', 'details'))
  getFollowsSelf(
    @Query() query: GetMyFollowsRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyFollows(query.toQuery(), metadata);
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get list of users following current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching followers', 'details'))
  getFollowersSelf(
    @Query() query: GetMyFollowersRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyFollowers(query.toQuery(), metadata);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get list of blocked users by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching blocks', 'details'))
  getBlocksSelf(
    @Query() query: GetMyBlocksRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getMyBlocks(query.toQuery(), metadata);
  }

  @Get('who-blocked-me')
  @ApiOperation({ summary: 'Get list of users who blocked current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching who blocked me', 'details'))
  getWhoBlockedMeSelf(
    @Query() query: GetWhoBlockedMeRequestDTO,
    @CurrentUser() user: AuthUser,
    @Req() req: Record<string, unknown>,
  ) {
    query.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getWhoBlockedMe(query.toQuery(), metadata);
  }
}

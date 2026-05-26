import { Controller, Get, Query, Req, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { map } from 'rxjs';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseRelationshipGrpcController } from '../../base-grpc.controller.js';
import { SOCIAL_PACKAGE, USER_PACKAGE } from '../../../../../grpc/grpc-packages.js';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts-nest';
import type { WithMetadata } from '../../../../../common/types/grpc.types.js';
import { ListUsersResponseDTO } from '../../../../user/dto/response/index.js';
import {
  GetMyFollowsRequestDTO,
  GetMyFollowersRequestDTO,
  GetMyBlocksRequestDTO,
  GetWhoBlockedMeRequestDTO,
} from '../../../dto/request/index.js';
import { IdsListResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Social - Relationships - Queries')
@Controller('social')
export class RelationshipQueryController extends BaseRelationshipGrpcController {
  private userService!: WithMetadata<UserServiceClient>;

  constructor(
    @Inject(SOCIAL_PACKAGE) client: ClientGrpc,
    @Inject(USER_PACKAGE) private readonly userClient: ClientGrpc,
  ) {
    super(client);
  }

  onModuleInit() {
    super.onModuleInit();
    this.userService = this.userClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Get('follows')
  @ApiOperation({ summary: 'Get list of users followed by current user' })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching follows', 'details'))
  getFollowsSelf(@Query() query: GetMyFollowsRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.userService
      .getMyFollowsProfiles({ pagination }, metadata)
      .pipe(map((res) => ListUsersResponseDTO.fromResponse(res)));
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get list of users following current user' })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching followers', 'details'))
  getFollowersSelf(@Query() query: GetMyFollowersRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.userService
      .getMyFollowersProfiles({ pagination }, metadata)
      .pipe(map((res) => ListUsersResponseDTO.fromResponse(res)));
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get list of blocked users by current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching blocks', 'details'))
  getBlocksSelf(@Query() query: GetMyBlocksRequestDTO, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getMyBlocks({ pagination }, metadata);
  }

  @Get('who-blocked-me')
  @ApiOperation({ summary: 'Get list of users who blocked current user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching who blocked me', 'details'))
  getWhoBlockedMeSelf(
    @Query() query: GetWhoBlockedMeRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.queryService.getWhoBlockedMe({ pagination }, metadata);
  }
}

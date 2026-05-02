import { Controller, Post, Get, Delete, Param, Inject, OnModuleInit, Query } from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  RelationshipCommandServiceClient,
  RELATIONSHIP_QUERY_SERVICE_NAME,
  RelationshipQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { ActionSuccessResponseDTO, IdsListResponseDTO } from '../dto/response/index.js';
import {
  GetMyFollowsRequestDTO,
  GetMyFollowersRequestDTO,
  GetMyBlocksRequestDTO,
  GetWhoBlockedMeRequestDTO,
} from '../dto/request/index.js';
import {
  CustomApiError,
  SOCIAL_RELATIONSHIP_ALREADY_EXISTS,
  SOCIAL_RELATIONSHIP_NOT_FOUND,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Relationships')
@Controller('social/users/:userId')
export class RelationshipController implements OnModuleInit {
  private commandService!: RelationshipCommandServiceClient;
  private queryService!: RelationshipQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<RelationshipCommandServiceClient>(
      RELATIONSHIP_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<RelationshipQueryServiceClient>(
      RELATIONSHIP_QUERY_SERVICE_NAME,
    );
  }

  @Post('follow/:followedId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', example: 'uuid-follower' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('creating follow relationship', 'details'))
  follow(@Param('userId') userId: string, @Param('followedId') followedId: string) {
    return this.commandService
      .postFollowUser({
        followerId: userId,
        followedId,
      })
      .pipe(map(() => ({ success: true, message: 'Followed successfully' })));
  }

  @Delete('follow/:followedId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', example: 'uuid-follower' })
  @ApiParam({ name: 'followedId', example: 'uuid-followed' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'followedId', 'FOLLOW'))
  @CustomApiError(() => DATABASE_ERROR('deleting follow relationship', 'details'))
  unfollow(@Param('userId') userId: string, @Param('followedId') followedId: string) {
    return this.commandService
      .deleteFollowUser({
        followerId: userId,
        followedId,
      })
      .pipe(map(() => ({ success: true, message: 'Unfollowed successfully' })));
  }

  @Post('block/:blockedId')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'userId', example: 'uuid-blocker' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_ALREADY_EXISTS('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('creating block relationship', 'details'))
  block(@Param('userId') userId: string, @Param('blockedId') blockedId: string) {
    return this.commandService
      .postBlockUser({ blockerId: userId, blockedId })
      .pipe(map(() => ({ success: true, message: 'Blocked successfully' })));
  }

  @Delete('block/:blockedId')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'userId', example: 'uuid-blocker' })
  @ApiParam({ name: 'blockedId', example: 'uuid-blocked' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_RELATIONSHIP_NOT_FOUND('userId', 'blockedId', 'BLOCK'))
  @CustomApiError(() => DATABASE_ERROR('deleting block relationship', 'details'))
  unblock(@Param('userId') userId: string, @Param('blockedId') blockedId: string) {
    return this.commandService
      .deleteBlockUser({
        blockerId: userId,
        blockedId,
      })
      .pipe(map(() => ({ success: true, message: 'Unblocked successfully' })));
  }

  @Get('follows')
  @ApiOperation({ summary: 'Get list of users followed by this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching follows', 'details'))
  getFollows(@Param('userId') userId: string, @Query() query: GetMyFollowsRequestDTO) {
    query.userId = userId;
    return this.queryService.getMyFollows(query.toQuery());
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get list of users following this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching followers', 'details'))
  getFollowers(@Param('userId') userId: string, @Query() query: GetMyFollowersRequestDTO) {
    query.userId = userId;
    return this.queryService.getMyFollowers(query.toQuery());
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Get list of blocked users' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching blocks', 'details'))
  getBlocks(@Param('userId') userId: string, @Query() query: GetMyBlocksRequestDTO) {
    query.userId = userId;
    return this.queryService.getMyBlocks(query.toQuery());
  }

  @Get('who-blocked-me')
  @ApiOperation({ summary: 'Get list of users who blocked this user' })
  @ApiParam({ name: 'userId', example: 'uuid-user' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching who blocked me', 'details'))
  getWhoBlockedMe(@Param('userId') userId: string, @Query() query: GetWhoBlockedMeRequestDTO) {
    query.userId = userId;
    return this.queryService.getWhoBlockedMe(query.toQuery());
  }
}

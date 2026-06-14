import { Controller, Get, Req, Param, Query } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CustomApiError, USER_NOT_FOUND, DATABASE_ERROR } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseUserGrpcController } from '../../base-user-grpc.controller.js';
import { GetUserRequestDTO } from '../../../dto/request/index.js';
import {
  GetEventParticipantsRequestDTO,
  GetPostLikersRequestDTO,
} from '../../../../social/dto/request/index.js';
import { ListUsersPublicResponseDTO, UserResponseDTO } from '../../../dto/response/index.js';
import { PublicUserResponseDTO } from '../../../dto/response/public-user.response.dto.js';

@GatewayController('Users')
@Controller('users')
export class UserQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserQueryController.name });

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Get('me')
  getMe(@CurrentUser() user: AuthUser, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching current user profile: ${user.id}`);
    const dto = new GetUserRequestDTO();
    dto.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getUser(dto.toQuery(), metadata)
      .pipe(map((res) => UserResponseDTO.fromResponse(res)));
  }

  @Get(':userId/public')
  @ApiOperation({ summary: 'Get the public profile of an user' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ListUsersPublicResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching user', 'details'))
  getPublicUser(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching public user profile: ${userId}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getPublicUser({ userId }, metadata)
      .pipe(map((res) => PublicUserResponseDTO.fromResponse(res)));
  }

  @Get('event/:eventId/participants')
  @ApiOperation({ summary: 'Get list of participants for an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: ListUsersPublicResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching event participants', 'details'))
  getEventParticipants(
    @Param('eventId') eventId: string,
    @Query() query: GetEventParticipantsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.userService
      .getEventParticipantsProfiles({ eventId, pagination }, metadata)
      .pipe(map((res) => ListUsersPublicResponseDTO.fromResponse(res)));
  }

  @Get('post/:postId/likers')
  @ApiOperation({ summary: 'Get list of users who liked a post' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ListUsersPublicResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching post likers', 'details'))
  getPostLikers(
    @Param('postId') postId: string,
    @Query() query: GetPostLikersRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const { pagination } = query;
    return this.userService
      .getPostLikersProfiles({ postId, pagination }, metadata)
      .pipe(map((res) => ListUsersPublicResponseDTO.fromResponse(res)));
  }
}

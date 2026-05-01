import { Controller, Post, Get, Delete, Param, Inject, OnModuleInit, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
  SocialUserNodeCommandServiceClient,
  SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
  SocialUserNodeQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { ActionSuccessResponseDTO, ExistsResponseDTO } from '../dto/response/index.js';
import {
  CustomApiError,
  SOCIAL_USER_ALREADY_EXISTS,
  SOCIAL_USER_NOT_FOUND,
  DATABASE_ERROR,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@volontariapp/errors-nest';

@ApiTags('Social - Users')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('social/users')
export class SocialUserController implements OnModuleInit {
  private commandService!: WithMetadata<SocialUserNodeCommandServiceClient>;
  private queryService!: WithMetadata<SocialUserNodeQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<SocialUserNodeCommandServiceClient>(
      SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<SocialUserNodeQueryServiceClient>(
      SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
    );
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Create a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_USER_ALREADY_EXISTS('userId'))
  @CustomApiError(() => DATABASE_ERROR('creating social user node', 'details'))
  createUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .createUserNode({ userId }, metadata)
      .pipe(map(() => ({ success: true, message: 'User node created' })));
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Check if user node exists' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('checking social user existence', 'details'))
  getUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getUserNode({ userId }, metadata);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => SOCIAL_USER_NOT_FOUND('userId'))
  @CustomApiError(() => DATABASE_ERROR('deleting social user node', 'details'))
  deleteUserNode(@Param('userId') userId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .deleteUserNode({ userId }, metadata)
      .pipe(map(() => ({ success: true, message: 'User node deleted' })));
  }
}

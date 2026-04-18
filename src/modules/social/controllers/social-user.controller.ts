import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
  SocialUserNodeCommandServiceClient,
  SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
  SocialUserNodeQueryServiceClient,
} from '@volontariapp/contracts-nest';
import {
  ActionSuccessResponseDTO,
  ExistsResponseDTO,
} from '../dto/response/index.js';

@ApiTags('Social - Users')
@Controller('social/users')
export class SocialUserController implements OnModuleInit {
  private commandService!: SocialUserNodeCommandServiceClient;
  private queryService!: SocialUserNodeQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService =
      this.client.getService<SocialUserNodeCommandServiceClient>(
        SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
      );
    this.queryService =
      this.client.getService<SocialUserNodeQueryServiceClient>(
        SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
      );
  }

  @Post(':userId')
  @ApiOperation({ summary: 'Create a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  createUserNode(@Param('userId') userId: string) {
    return this.commandService
      .createUserNode({ userId })
      .pipe(map(() => ({ success: true, message: 'User node created' })));
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Check if user node exists' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ExistsResponseDTO })
  getUserNode(@Param('userId') userId: string) {
    return this.queryService.getUserNode({ userId });
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a social user node' })
  @ApiParam({ name: 'userId', example: 'uuid-user-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  deleteUserNode(@Param('userId') userId: string) {
    return this.commandService
      .deleteUserNode({ userId })
      .pipe(map(() => ({ success: true, message: 'User node deleted' })));
  }
}

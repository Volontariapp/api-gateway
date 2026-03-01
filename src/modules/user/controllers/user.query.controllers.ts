import { Controller, Get, Inject, OnModuleInit, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Users')
@Controller('users')
export class UserQueryController implements OnModuleInit {
  private userService!: UserServiceClient;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all users' })
  @Get()
  listUsers() {
    return this.userService.listUsers({ pagination: undefined });
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser({ id });
  }
}

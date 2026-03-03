import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts';
import type { UserQuery, ListUsersQuery } from '@volontariapp/contracts';
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  listUsers(@Query() query: { page?: number; limit?: number }) {
    return this.userService.listUsers({
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
    } as ListUsersQuery);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser({ id } as UserQuery);
  }
}

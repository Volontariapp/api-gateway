import {
  Body,
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts';
import type {
  CreateUserRequest,
  UpdateUserRequest,
} from '@volontariapp/contracts';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Users')
@Controller('users')
export class UserCommandController implements OnModuleInit {
  private userService!: UserServiceClient;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        password: { type: 'string', example: 'strongPassword123' },
        role: { type: 'string', example: 'USER' },
      },
    },
  })
  @Post()
  createUser(@Body() request: CreateUserRequest) {
    return this.userService.createUser(request);
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'new.email@example.com' },
        firstName: { type: 'string', example: 'Jane' },
        lastName: { type: 'string', example: 'Smith' },
        role: { type: 'string', example: 'ADMIN' },
      },
    },
  })
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() request: unknown) {
    return this.userService.updateUser({
      id,
      ...(request as Omit<UpdateUserRequest, 'id'>),
    });
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }
}

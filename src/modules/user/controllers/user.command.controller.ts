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
  CreateUserCommand,
  UpdateUserCommand,
} from '@volontariapp/contracts';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@volontariapp/errors-nest';

@ApiTags('Users')
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiInternalServerErrorResponse()
@ApiTooManyRequestsResponse()
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
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    example: {
      code: 'VALIDATION_ERROR',
      message: 'The provided email is invalid',
      details: { field: 'email', issue: 'invalid format' },
      path: '/api/v1/users',
    },
  })
  @ApiConflictResponse({
    description: 'User already exists',
    example: {
      code: 'USER_ALREADY_EXISTS',
      message: 'A user with this email already exists',
      details: { field: 'email', value: 'john.doe@example.com' },
      path: '/api/v1/users',
    },
  })
  @Post()
  createUser(@Body() command: CreateUserCommand) {
    return this.userService.createUser(command);
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
  @ApiNotFoundResponse({
    description: 'User not found',
    example: {
      code: 'USER_NOT_FOUND',
      message: 'User with ID 123-456 not found',
      details: { id: '123-456' },
      path: '/api/v1/users/123-456',
    },
  })
  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() command: Partial<UpdateUserCommand>,
  ) {
    return this.userService.updateUser({
      ...command,
      id,
    } as UpdateUserCommand);
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiNotFoundResponse({
    description: 'User not found',
    example: {
      code: 'USER_NOT_FOUND',
      message: 'User with ID 123-456 not found',
      details: { id: '123-456' },
      path: '/api/v1/users/123-456',
    },
  })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser({ id });
  }
}

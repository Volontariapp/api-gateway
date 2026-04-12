import {
  Body,
  Controller,
  Delete,
  Inject,
  Get,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  UserServiceClient,
  DeleteUserCommand,
  UserQuery,
} from '@volontariapp/contracts-nest';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  ListUsersRequestDTO,
} from '../dto/request/index.js';
import {
  UserResponseDTO,
  ListUsersResponseDTO,
} from '../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../event/dto/response/index.js';

@ApiTags('Users')
@ApiExtraModels(UserResponseDTO, ListUsersResponseDTO, ActionSuccessResponseDTO)
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiForbiddenResponse('You do not have permission to manage users')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@ApiTooManyRequestsResponse('Too many requests, please try again later')
@Controller('users')
export class UserController implements OnModuleInit {
  private readonly logger = new Logger({ context: UserController.name });
  private userService!: UserServiceClient;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @Get()
  listUsers(@Query() request: ListUsersRequestDTO) {
    this.logger.log('Listing users');
    return this.userService.listUsers(request.toQuery());
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @ApiNotFoundResponse('UserDTO not found')
  @Get(':id')
  getUser(@Param('id') id: string) {
    this.logger.log(`Fetching user profile: ${id}`);
    const query: UserQuery = { id };
    return this.userService.getUser(query);
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDTO })
  @ApiConflictResponse('UserDTO already exists')
  @Post()
  createUser(@Body() request: CreateUserRequestDTO) {
    this.logger.log(`Registering new user: ${request.email}`);
    return this.userService.createUser(request.toCommand());
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @ApiNotFoundResponse('UserDTO not found')
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() request: UpdateUserRequestDTO) {
    this.logger.log(`Updating user profile: ${id}`);
    request.id = id;
    return this.userService.updateUser(request.toCommand());
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @ApiNotFoundResponse('UserDTO not found')
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    this.logger.log(`Deleting user account: ${id}`);
    const command: DeleteUserCommand = { id };
    return this.userService.deleteUser(command);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { map, switchMap } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
  USER_ALREADY_EXISTS,
  INVALID_RNA,
  INVALID_SCORE_INCREMENT,
  USER_ALREADY_HAS_BADGE,
  USER_BADGE_NOT_FOUND,
  BADGE_NOT_FOUND,
} from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { Public, UseRefreshToken } from '@volontariapp/auth';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import {
  USER_SERVICE_NAME,
  UserServiceClient,
  DeleteUserCommand,
  GetUserQuery,
  RemoveBadgeFromUserCommand,
} from '@volontariapp/contracts-nest';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  SignUpRequestDTO,
  UpdateUserRequestDTO,
  ListUsersRequestDTO,
  LoginRequestDTO,
  RefreshTokenRequestDTO,
  AddBadgeToUserRequestDTO,
  IncrementImpactScoreRequestDTO,
} from '../dto/request/index.js';
import {
  UserResponseDTO,
  ListUsersResponseDTO,
  SignUpResponseDTO,
  LoginResponseDTO,
} from '../dto/response/index.js';

@ApiTags('Users')
@ApiExtraModels(UserResponseDTO, ListUsersResponseDTO, SignUpResponseDTO, LoginResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage users')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('users')
export class UserController implements OnModuleInit {
  private readonly logger = new Logger({ context: UserController.name });
  private userService!: WithMetadata<UserServiceClient>;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @Get()
  listUsers(@Query() request: ListUsersRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing users');
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .listUsers(request.toQuery(), metadata)
      .pipe(map((res) => ListUsersResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Get(':id')
  getUser(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching user profile: ${id}`);
    const query: GetUserQuery = { userId: id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getUser(query, metadata)
      .pipe(map((res) => UserResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: SignUpResponseDTO })
  @CustomApiError(() => USER_ALREADY_EXISTS(''))
  @Public()
  @Post()
  signUp(@Body() request: SignUpRequestDTO) {
    this.logger.log(`Registering new user: ${request.email}`);
    return this.userService
      .signUp(request.toCommand())
      .pipe(map((res) => SignUpResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: LoginResponseDTO })
  @HttpCode(200)
  @Public()
  @Post('login')
  login(@Body() request: LoginRequestDTO) {
    this.logger.log(`Login attempt for: ${request.email}`);
    return this.userService
      .login(request.toCommand())
      .pipe(map((res) => LoginResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: LoginResponseDTO })
  @HttpCode(200)
  @UseRefreshToken()
  @Post('refresh')
  refreshToken(@Body() request: RefreshTokenRequestDTO) {
    this.logger.log('Refreshing tokens');
    return this.userService
      .refreshToken(request.toCommand())
      .pipe(map((res) => LoginResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_RNA(''))
  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body() request: UpdateUserRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating user profile: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.updateUser(request.toCommand(), metadata).pipe(
      switchMap(() => {
        const query: GetUserQuery = { userId: id };
        return this.userService.getUser(query, metadata);
      }),
      map((res) => UserResponseDTO.fromResponse(res)),
    );
  }

  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Delete(':id')
  deleteUser(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting user account: ${id}`);
    const command: DeleteUserCommand = { userId: id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.deleteUser(command, metadata);
  }

  @ApiOperation({ summary: 'Add a badge to a user' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 201 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => BADGE_NOT_FOUND(''))
  @CustomApiError(() => USER_ALREADY_HAS_BADGE('', ''))
  @Post(':id/badges')
  addBadge(
    @Param('id') userId: string,
    @Body() request: AddBadgeToUserRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Adding badge ${request.badgeId} to user ${userId}`);
    request.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.addBadgeToUser(request.toCommand(), metadata);
  }

  @ApiOperation({ summary: 'Remove a badge from a user' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiParam({ name: 'badgeId', example: 'uuid-badge-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => USER_BADGE_NOT_FOUND('', ''))
  @Delete(':id/badges/:badgeId')
  removeBadge(
    @Param('id') userId: string,
    @Param('badgeId') badgeId: string,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Removing badge ${badgeId} from user ${userId}`);
    const command: RemoveBadgeFromUserCommand = { userId, badgeId };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.removeBadgeFromUser(command, metadata);
  }

  @ApiOperation({ summary: 'Increment impact score for a user' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_SCORE_INCREMENT(0))
  @Post(':id/impact-score')
  incrementImpactScore(
    @Param('id') userId: string,
    @Body() request: IncrementImpactScoreRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Incrementing impact score for user ${userId}`);
    request.userId = userId;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.incrementImpactScore(request.toCommand(), metadata);
  }
}

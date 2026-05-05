import { Body, Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomApiError, USER_ALREADY_EXISTS } from '@volontariapp/errors-nest';
import type { ClientGrpc } from '@nestjs/microservices';
import { Public, UseRefreshToken } from '@volontariapp/auth';
import { WithMetadata } from '../../../../common/types/grpc.types.js';
import { USER_PACKAGE } from '../../../../grpc/grpc-packages.js';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts-nest';
import {
  SignUpRequestDTO,
  LoginRequestDTO,
  RefreshTokenRequestDTO,
} from '../../dto/request/index.js';
import { SignUpResponseDTO, LoginResponseDTO } from '../../dto/response/index.js';

@ApiTags('Users - Auth')
@Controller('users')
export class UserAuthController implements OnModuleInit {
  private readonly logger = new Logger({ context: UserAuthController.name });
  private userService!: WithMetadata<UserServiceClient>;

  constructor(@Inject(USER_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
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
  @UseRefreshToken()
  @Post('refresh')
  refreshToken(@Body() request: RefreshTokenRequestDTO) {
    this.logger.log('Refreshing tokens');
    return this.userService
      .refreshToken(request.toCommand())
      .pipe(map((res) => LoginResponseDTO.fromResponse(res)));
  }
}

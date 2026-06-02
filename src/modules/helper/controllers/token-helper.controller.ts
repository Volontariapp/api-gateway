import { Controller, Get, Query, OnModuleInit } from '@nestjs/common';
import { JwtService, Public } from '@volontariapp/auth';
import { ApiTags, ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { TokenResponseDTO } from '../dto/response/token-response.dto.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { Logger } from '@volontariapp/logger';
import { UserRoles } from '@volontariapp/shared';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

@ApiTags('Tokens Helper')
@Public()
@Controller('helpers/tokens')
export class TokenHelperController implements OnModuleInit {
  private readonly logger = new Logger({ context: TokenHelperController.name });
  private checkKey: string | undefined;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  onModuleInit() {
    const path = this.configService.auth.accessTokenPublicKeyPath;
    try {
      if (fs.existsSync(path)) {
        this.checkKey = fs.readFileSync(path, 'utf8');
        this.logger.log(`Check key loaded in memory from ${path}`);
      } else {
        this.logger.warn(`Check key not found at ${path}`);
      }
    } catch (error) {
      this.logger.error(`Failed to load check key from ${path}`, error);
    }
  }

  @Get('check-key')
  @ApiOperation({
    summary: 'Get the stored check key',
    description: 'Returns the check key (public) loaded from the configured path.',
  })
  getCheckKey() {
    return { key: this.checkKey };
  }

  @Get('access-token')
  @ApiOperation({
    summary: 'Generate an Access Token',
    description:
      'Creates a signed access token for development and testing. Contains userId and role in payload.',
  })
  @ApiQuery({
    name: 'userId',
    example: randomUUID(),
    description: 'User ID to include in the payload',
  })
  @ApiQuery({
    name: 'role',
    enum: UserRoles,
    example: UserRoles.VOLUNTEER,
    required: false,
    description: 'User role (default: VOLUNTEER)',
  })
  @ApiOkResponse({ type: TokenResponseDTO })
  async generateAccessToken(
    @Query('userId') userId: string,
    @Query('role') role: UserRoles = UserRoles.VOLUNTEER,
  ): Promise<TokenResponseDTO> {
    this.logger.log(`Generating Access Token for user: ${userId} (role: ${role})`);
    const token = await this.jwtService.signAccessToken({ id: userId, role });
    return { token };
  }

  @Get('admin-token')
  @ApiOperation({
    summary: 'Generate an Admin Access Token',
    description: 'Shortcut to create a signed access token with the ADMIN role for testing.',
  })
  @ApiOkResponse({ type: TokenResponseDTO })
  async generateAdminToken(): Promise<TokenResponseDTO> {
    const adminId = '00000000-0000-0000-0000-000000000000';
    this.logger.log('Generating Admin Access Token (Shortcut)');
    const token = await this.jwtService.signAccessToken({ id: adminId, role: UserRoles.ADMIN });
    return { token };
  }

  @Get('refresh-token')
  @ApiOperation({
    summary: 'Generate a Refresh Token',
    description: 'Creates a signed refresh token for development and testing.',
  })
  @ApiQuery({ name: 'userId', example: randomUUID() })
  @ApiQuery({ name: 'role', example: 'user', required: false })
  @ApiOkResponse({ type: TokenResponseDTO })
  async generateRefreshToken(
    @Query('userId') userId: string,
    @Query('role') role: UserRoles = UserRoles.VOLUNTEER,
  ): Promise<TokenResponseDTO> {
    this.logger.log(`Generating Refresh Token for user: ${userId}`);
    const token = await this.jwtService.signRefreshToken({ id: userId, role });
    return { token };
  }

  @Get('internal-token')
  @ApiOperation({
    summary: 'Generate an Internal Token',
    description: 'Creates a signed internal token used for inter-service communication.',
  })
  @ApiQuery({ name: 'userId', example: randomUUID() })
  @ApiQuery({ name: 'role', example: 'user', required: false })
  @ApiOkResponse({ type: TokenResponseDTO })
  async generateInternalToken(
    @Query('userId') userId: string,
    @Query('role') role: UserRoles = UserRoles.VOLUNTEER,
  ): Promise<TokenResponseDTO> {
    this.logger.log(`Generating Internal Token for user: ${userId}`);
    const token = await this.jwtService.signInternal({ id: userId, role });
    return { token };
  }
}

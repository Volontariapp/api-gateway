import { Controller, Get, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser, AccessTokenGuard } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { UseGuards } from '@nestjs/common';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { GetUserRequestDTO } from '../../dto/request/index.js';
import { UserResponseDTO } from '../../dto/response/index.js';

@ApiTags('Users - Queries')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('users')
@UseGuards(AccessTokenGuard)
export class UserQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserQueryController.name });

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Get('me')
  getMe(@CurrentUser() user: AuthUser, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching current user profile: ${user.id}`);
    const dto = new GetUserRequestDTO();
    dto.userId = user.id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getUser(dto.toQuery(), metadata)
      .pipe(map((res) => UserResponseDTO.fromResponse(res)));
  }
}

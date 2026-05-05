import { Controller, Get, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomApiError, USER_NOT_FOUND } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseUserGrpcController } from '../../base-user-grpc.controller.js';
import { GetUserRequestDTO } from '../../../dto/request/index.js';
import { UserResponseDTO } from '../../../dto/response/index.js';

@GatewayController('Users')
@Controller('users')
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

import { Body, Controller, Delete, Patch, Req } from '@nestjs/common';
import { map, switchMap } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
  INVALID_RNA,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser, AccessTokenGuard } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { UseGuards } from '@nestjs/common';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { GetUserQuery } from '@volontariapp/contracts-nest';
import { UpdateUserRequestDTO } from '../../dto/request/index.js';
import { UserResponseDTO } from '../../dto/response/index.js';

@ApiTags('Users - Commands')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('users')
@UseGuards(AccessTokenGuard)
export class UserCommandController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserCommandController.name });

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_RNA(''))
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() request: UpdateUserRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating current user profile: ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.updateUser(request.toCommand(), metadata).pipe(
      switchMap(() => {
        const query: GetUserQuery = { userId: user.id };
        return this.userService.getUser(query, metadata);
      }),
      map((res) => UserResponseDTO.fromResponse(res)),
    );
  }

  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200 })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting current user account: ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.deleteUser({}, metadata);
  }
}

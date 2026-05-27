import { Body, Controller, Delete, Patch, Req } from '@nestjs/common';
import { map, switchMap } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CustomApiError,
  USER_NOT_FOUND,
  INVALID_RNA,
  DATABASE_ERROR,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BaseUserGrpcController } from '../../base-user-grpc.controller.js';
import { GetUserQuery, DeleteUserCommand } from '@volontariapp/contracts-nest';
import { UpdateUserRequestDTO } from '../../../dto/request/index.js';
import { UserResponseDTO } from '../../../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../../../event/dto/response/index.js';

@GatewayController('Users')
@Controller('users')
export class UserCommandController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserCommandController.name });

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_RNA(''))
  @ApiResponse({
    status: 206,
    description:
      "L'opération n'a pas pu être finalisée immédiatement, elle sera traitée en arrière-plan.",
  })
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
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => DATABASE_ERROR('deleting account', 'details'))
  @ApiResponse({
    status: 206,
    description:
      "L'opération n'a pas pu être finalisée immédiatement, elle sera traitée en arrière-plan.",
  })
  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting current user account: ${user.id}`);
    const command: DeleteUserCommand = {};
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.deleteUser(command, metadata);
  }
}

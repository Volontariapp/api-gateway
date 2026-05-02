import { Body, Controller, Delete, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { map, switchMap } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
  INVALID_RNA,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { GetUserQuery, DeleteUserCommand } from '@volontariapp/contracts-nest';
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
export class UserCommandController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserCommandController.name });

  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @CustomApiError(() => INVALID_RNA(''))
  @UseGuards(IsCurrentUserOrAdminGuard)
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
  @UseGuards(IsCurrentUserOrAdminGuard)
  @Delete(':id')
  deleteUser(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting user account: ${id}`);
    const command: DeleteUserCommand = { userId: id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService.deleteUser(command, metadata);
  }
}

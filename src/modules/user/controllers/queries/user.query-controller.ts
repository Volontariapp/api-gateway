import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  USER_NOT_FOUND,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { IsCurrentUserOrAdminGuard } from '../../../../common/guards/is-current-user-or-admin.guard.js';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { GetUserQuery } from '@volontariapp/contracts-nest';
import { UserResponseDTO } from '../../dto/response/index.js';

@ApiTags('Users - Queries')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to access this resource')
@Controller('users')
export class UserQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserQueryController.name });

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: UserResponseDTO })
  @CustomApiError(() => USER_NOT_FOUND(''))
  @UseGuards(IsCurrentUserOrAdminGuard)
  @Get(':id')
  getUser(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Fetching user profile: ${id}`);
    const query: GetUserQuery = { userId: id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .getUser(query, metadata)
      .pipe(map((res) => UserResponseDTO.fromResponse(res)));
  }
}

import { Controller, Get, Query, Req } from '@nestjs/common';
import { map } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { BaseUserGrpcController } from '../base-user-grpc.controller.js';
import { ListUsersRequestDTO } from '../../dto/request/index.js';
import { ListUsersResponseDTO } from '../../dto/response/index.js';

@ApiTags('Users - Admin')
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@Controller('users')
export class UserAdminQueryController extends BaseUserGrpcController {
  private readonly logger = new Logger({ context: UserAdminQueryController.name });

  @ApiOperation({
    summary: 'List all users',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nFetch a paginated list of all users in the system. Requires a valid **access-token** JWT with the `admin` role.',
  })
  @ApiResponse({ status: 200, type: ListUsersResponseDTO })
  @Roles(UserRoles.ADMIN)
  @Get()
  listUsers(@Query() request: ListUsersRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing users');
    const metadata = req['internalMetadata'] as Metadata;
    return this.userService
      .listUsers(request.toQuery(), metadata)
      .pipe(map((res) => ListUsersResponseDTO.fromResponse(res)));
  }
}

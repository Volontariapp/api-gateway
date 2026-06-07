import { Controller } from '@nestjs/common';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  ApiUnauthorizedResponse,
} from '@volontariapp/errors-nest';

import { BasePostGrpcController } from '../../base-grpc.controller.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';

@ApiTags('Admin Posts')
@ApiBearerAuth('access-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage posts as admin')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController(`AdminPost`)
@Controller('admin/posts')
export class AdminPostCommandController extends BasePostGrpcController {
  // TODO: Add admin-specific command endpoints here (e.g. override delete, force update, etc.)
}

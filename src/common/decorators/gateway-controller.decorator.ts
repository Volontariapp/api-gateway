/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import { AccessTokenGuard, RolesGuard } from '@volontariapp/auth';

export interface GatewayControllerOptions {
  /**
   * Whether this controller is admin-only.
   * If true, adds RolesGuard and admin-specific forbidden response.
   * @default false
   */
  admin?: boolean;

  /**
   * Extra models to be registered in Swagger.
   */
  extraModels?: Function[];

  /**
   * Custom forbidden response message.
   */
  forbiddenMessage?: string;
}

/**
 * Composed decorator for Gateway Controllers.
 * Reduces boilerplate by applying common Swagger and Auth decorators.
 *
 * @param tag The Swagger tag for this controller.
 * @param options Additional options for auth and swagger.
 */
export function GatewayController(tag: string, options: GatewayControllerOptions = {}) {
  const { admin = false, extraModels = [], forbiddenMessage } = options;

  const defaultForbiddenMessage = admin
    ? 'Required role: ADMIN — your token does not grant this access'
    : 'Access denied';

  const decorators = [
    ApiTags(tag),
    ApiBearerAuth('access-token'),
    ApiBearerAuth('refresh-token'),
    CustomApiError(MISSING_ACCESS_TOKEN),
    ApiForbiddenResponse(forbiddenMessage ?? defaultForbiddenMessage),
    ApiInternalServerErrorResponse({ description: 'An unexpected error occurred on the server' }),
  ];

  if (extraModels.length > 0) {
    decorators.push(ApiExtraModels(...extraModels));
  }

  if (admin) {
    decorators.push(UseGuards(AccessTokenGuard, RolesGuard));
  } else {
    decorators.push(UseGuards(AccessTokenGuard));
  }

  return applyDecorators(...decorators);
}

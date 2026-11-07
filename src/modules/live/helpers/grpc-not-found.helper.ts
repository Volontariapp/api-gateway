import { GrpcStatus, isBaseApiError } from '@volontariapp/errors';

const NOT_FOUND_HTTP_STATUS = 404;

function parsedStatusCode(details: unknown): number | undefined {
  if (typeof details !== 'string' || !details.includes('{')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(
      details.substring(details.indexOf('{'), details.lastIndexOf('}') + 1),
    );
    if (typeof parsed === 'object' && parsed !== null && 'statusCode' in parsed) {
      return typeof parsed.statusCode === 'number' ? parsed.statusCode : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Whether an error of a gRPC call means "the resource does not exist": a decoded business error
 * (404), the gRPC status NOT_FOUND, or the JSON error body ms-* put in the status details.
 */
export function isGrpcNotFound(error: unknown): boolean {
  if (isBaseApiError(error)) {
    return error.statusCode === NOT_FOUND_HTTP_STATUS;
  }
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if ('code' in error && error.code === GrpcStatus.NOT_FOUND) {
    return true;
  }
  const details =
    'details' in error ? error.details : 'message' in error ? error.message : undefined;
  return parsedStatusCode(details) === NOT_FOUND_HTTP_STATUS;
}

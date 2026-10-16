import { ServiceUnavailableException } from '@nestjs/common';
import { GrpcStatus } from '@volontariapp/errors';
import { catchError, throwError, timeout, TimeoutError, type MonoTypeOperatorFunction } from 'rxjs';

export const STORAGE_CONFIRM_DEADLINE_MS = 10_000;

const UNAVAILABLE_CODES: readonly number[] = [GrpcStatus.UNAVAILABLE, GrpcStatus.DEADLINE_EXCEEDED];

const isUnavailableGrpcError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'number' &&
  UNAVAILABLE_CODES.includes(error.code);

/**
 * Maps ms-storage unavailability (gRPC UNAVAILABLE, DEADLINE_EXCEEDED or a local timeout)
 * to HTTP 503, as required by the storage security doc (section 3).
 * Domain errors (NOT_FOUND, FAILED_PRECONDITION...) are relayed untouched by the global filter.
 */
export const mapStorageUnavailable = <T>(): MonoTypeOperatorFunction<T> =>
  catchError((error: unknown) =>
    throwError(() =>
      error instanceof TimeoutError || isUnavailableGrpcError(error)
        ? new ServiceUnavailableException('Storage service is temporarily unavailable')
        : error,
    ),
  );

/**
 * Applies a local deadline to a gRPC call, then maps unavailability to HTTP 503.
 */
export const withStorageDeadline = <T>(
  deadlineMs: number = STORAGE_CONFIRM_DEADLINE_MS,
): MonoTypeOperatorFunction<T> => {
  const applyTimeout = timeout<T>({ first: deadlineMs });
  const mapUnavailable = mapStorageUnavailable<T>();
  return (source) => mapUnavailable(applyTimeout(source));
};

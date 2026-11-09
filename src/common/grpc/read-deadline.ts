import { GatewayTimeoutException } from '@nestjs/common';
import type { CallOptions } from '@grpc/grpc-js';
import { GrpcStatus } from '@volontariapp/errors';
import { catchError, defer, throwError, type Observable } from 'rxjs';

/** Environment variable holding the deadline of a read call, in milliseconds. */
export const GRPC_READ_DEADLINE_ENV = 'GRPC_READ_DEADLINE_MS';

/**
 * 2 s: four times the healthy end-to-end p95 at 250 req/s (489 ms), so a normal read never hits
 * it, while a queue that builds up under overload is cut well before the 4 to 5 s seen at 275 req/s.
 */
export const DEFAULT_GRPC_READ_DEADLINE_MS = 2_000;

/** The configured deadline; a missing, non-integer or non-positive value gives the default. */
export const grpcReadDeadlineMs = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): number => {
  const raw = env[GRPC_READ_DEADLINE_ENV]?.trim();
  const value = raw ? Number(raw) : Number.NaN;
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_GRPC_READ_DEADLINE_MS;
};

const isDeadlineExceeded = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === GrpcStatus.DEADLINE_EXCEEDED;

/**
 * Runs a gRPC read with a deadline (grpc-js `CallOptions`, passed by Nest as the third argument):
 * past it, grpc-js cancels the call, the ms-* sees the cancellation, and the client gets HTTP 504
 * instead of the 500 the global filter gives a raw DEADLINE_EXCEEDED. The deadline is computed at
 * subscription. Reads only: an interrupted write keeps running on the server side.
 */
export const withReadDeadline = <T>(
  call: (options: CallOptions) => Observable<T>,
  deadlineMs?: number,
): Observable<T> =>
  defer(() => call({ deadline: Date.now() + (deadlineMs ?? grpcReadDeadlineMs()) })).pipe(
    catchError((error: unknown) =>
      throwError(() =>
        isDeadlineExceeded(error)
          ? new GatewayTimeoutException('Upstream service did not answer in time')
          : error,
      ),
    ),
  );

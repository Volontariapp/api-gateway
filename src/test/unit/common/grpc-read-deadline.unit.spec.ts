import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GatewayTimeoutException, HttpStatus } from '@nestjs/common';
import type { CallOptions } from '@grpc/grpc-js';
import { GrpcStatus } from '@volontariapp/errors';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  DEFAULT_GRPC_READ_DEADLINE_MS,
  GRPC_READ_DEADLINE_ENV,
  grpcReadDeadlineMs,
  withReadDeadline,
} from '../../../common/grpc/read-deadline.js';
import { createGrpcErrorFactory } from '../../helpers/factories/grpc-error.factory.js';
import { createHttpArgumentsHostMock } from '../../helpers/mocks/http-arguments-host.mock.js';
import { setupVolontariappLoggerMock } from '../../helpers/mocks/volontariapp-logger.mock.js';

const NOW = 1_800_000_000_000;

describe('gRPC read deadline (Unit)', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('grpcReadDeadlineMs', () => {
    it('should default to 2 s', () => {
      expect(DEFAULT_GRPC_READ_DEADLINE_MS).toBe(2_000);
      expect(grpcReadDeadlineMs({})).toBe(DEFAULT_GRPC_READ_DEADLINE_MS);
    });

    it('should read the environment variable', () => {
      expect(grpcReadDeadlineMs({ [GRPC_READ_DEADLINE_ENV]: '3500' })).toBe(3_500);
    });

    it.each(['', ' ', 'abc', '0', '-5', '1.5'])(
      'should fall back to the default for the invalid value "%s"',
      (raw) => {
        expect(grpcReadDeadlineMs({ [GRPC_READ_DEADLINE_ENV]: raw })).toBe(
          DEFAULT_GRPC_READ_DEADLINE_MS,
        );
      },
    );
  });

  describe('withReadDeadline', () => {
    it('should pass an absolute deadline to the call', async () => {
      const call = jest.fn((_options: CallOptions) => of('ok'));

      await expect(firstValueFrom(withReadDeadline(call))).resolves.toBe('ok');
      expect(call).toHaveBeenCalledWith({
        deadline: NOW + grpcReadDeadlineMs(),
      });
    });

    it('should compute the deadline when subscribed, not when built', async () => {
      const call = jest.fn((_options: CallOptions) => of('ok'));
      const call$ = withReadDeadline(call, 1_000);
      jest.spyOn(Date, 'now').mockReturnValue(NOW + 50);

      await firstValueFrom(call$);

      expect(call).toHaveBeenCalledWith({ deadline: NOW + 50 + 1_000 });
    });

    it('should use an explicit deadline', async () => {
      const call = jest.fn((_options: CallOptions) => of('ok'));

      await firstValueFrom(withReadDeadline(call, 750));

      expect(call).toHaveBeenCalledWith({ deadline: NOW + 750 });
    });

    it('should turn DEADLINE_EXCEEDED into a gateway timeout', async () => {
      const call$ = withReadDeadline(() => throwError(() => createGrpcErrorFactory()));

      await expect(firstValueFrom(call$)).rejects.toBeInstanceOf(GatewayTimeoutException);
    });

    it('should relay any other gRPC error untouched', async () => {
      const notFound = createGrpcErrorFactory(GrpcStatus.NOT_FOUND, '{"statusCode":404}');
      const call$ = withReadDeadline(() => throwError(() => notFound));

      await expect(firstValueFrom(call$)).rejects.toBe(notFound);
    });
  });

  describe('HTTP status through the global exception filter', () => {
    beforeEach(() => {
      setupVolontariappLoggerMock();
    });

    it('should answer 500 for a raw DEADLINE_EXCEEDED (why the mapping exists)', () => {
      const { host, response } = createHttpArgumentsHostMock();

      new GlobalExceptionFilter().catch(createGrpcErrorFactory(), host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should answer 504 once the read deadline mapped the error', async () => {
      const { host, response } = createHttpArgumentsHostMock();
      const error = await firstValueFrom(
        withReadDeadline(() => throwError(() => createGrpcErrorFactory())),
      ).catch((caught: unknown) => caught);

      new GlobalExceptionFilter().catch(error, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.GATEWAY_TIMEOUT);
    });
  });
});

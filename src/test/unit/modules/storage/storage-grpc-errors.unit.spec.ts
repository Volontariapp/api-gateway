import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { GrpcStatus } from '@volontariapp/errors';
import { firstValueFrom, NEVER, of, throwError } from 'rxjs';
import {
  mapStorageUnavailable,
  withStorageDeadline,
} from '../../../../modules/storage/common/storage-grpc-errors.js';

describe('storage gRPC errors (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('mapStorageUnavailable', () => {
    it('should let successful values through', async () => {
      await expect(firstValueFrom(of('ok').pipe(mapStorageUnavailable()))).resolves.toBe('ok');
    });

    it.each([
      ['UNAVAILABLE', GrpcStatus.UNAVAILABLE],
      ['DEADLINE_EXCEEDED', GrpcStatus.DEADLINE_EXCEEDED],
    ])('should map gRPC %s to a 503', async (_label, code) => {
      const source$ = throwError(() => ({ code, details: 'down' }));

      await expect(firstValueFrom(source$.pipe(mapStorageUnavailable()))).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('should relay domain errors untouched', async () => {
      const domainError = { code: GrpcStatus.NOT_FOUND, details: '{"statusCode":404}' };
      const source$ = throwError(() => domainError);

      await expect(firstValueFrom(source$.pipe(mapStorageUnavailable()))).rejects.toBe(domainError);
    });
  });

  describe('withStorageDeadline', () => {
    it('should map a local timeout to a 503', async () => {
      await expect(firstValueFrom(NEVER.pipe(withStorageDeadline(10)))).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('should let a fast response through', async () => {
      await expect(firstValueFrom(of('done').pipe(withStorageDeadline(1000)))).resolves.toBe(
        'done',
      );
    });
  });
});

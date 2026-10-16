import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { EntityType, type StorageServiceClient } from '@volontariapp/contracts-nest';
import { GrpcStatus } from '@volontariapp/errors';
import { createMock } from '@volontariapp/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { StorageCommandController } from '../../../../modules/storage/controllers/commands/storage.command-controller.js';
import { StorageQueryController } from '../../../../modules/storage/controllers/queries/storage.query-controller.js';
import { GenerateUploadUrlRequestDTO } from '../../../../modules/storage/dto/request/index.js';
import { MockStorageClientGrpc } from '../../../helpers/mocks/storage-client-grpc.mock.js';
import { createAuthUserMock } from '../../../helpers/factories/auth-user.factory.js';
import {
  FILE_ID,
  createConfirmUploadResponseFactory,
  createFileMetadataResponseFactory,
  createGenerateUploadUrlResponseFactory,
} from '../../../helpers/factories/storage.factory.js';

describe('Storage controllers (Unit)', () => {
  let storageService: jest.Mocked<StorageServiceClient>;
  let commandController: StorageCommandController;
  let queryController: StorageQueryController;
  const user = createAuthUserMock();
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };

  beforeEach(() => {
    storageService = createMock<StorageServiceClient>();
    const client = new MockStorageClientGrpc(storageService);
    commandController = new StorageCommandController(client);
    queryController = new StorageQueryController(client);
    commandController.onModuleInit();
    queryController.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('should forward the command with the internal metadata and map the response', async () => {
      const spy = jest
        .spyOn(storageService, 'generateUploadUrl')
        .mockReturnValue(of(createGenerateUploadUrlResponseFactory()));
      const request = new GenerateUploadUrlRequestDTO();
      request.mimeType = 'image/jpeg';
      request.sizeBytes = 2048;
      request.entityType = EntityType.ENTITY_TYPE_USER_AVATAR;

      const response = await firstValueFrom(
        commandController.generateUploadUrl(user, request, req),
      );

      expect(spy).toHaveBeenCalledWith(request.toCommand(), metadata);
      expect(response.fileId).toBe(FILE_ID);
      expect(response.uploadFields).toHaveProperty('policy');
    });

    it('should return a 503 when ms-storage is unavailable', async () => {
      jest
        .spyOn(storageService, 'generateUploadUrl')
        .mockReturnValue(throwError(() => ({ code: GrpcStatus.UNAVAILABLE })));
      const request = new GenerateUploadUrlRequestDTO();

      await expect(
        firstValueFrom(commandController.generateUploadUrl(user, request, req)),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('confirmUpload', () => {
    it('should forward the file id from the path with the internal metadata', async () => {
      const spy = jest
        .spyOn(storageService, 'confirmUpload')
        .mockReturnValue(of(createConfirmUploadResponseFactory()));

      const response = await firstValueFrom(commandController.confirmUpload(user, FILE_ID, req));

      expect(spy).toHaveBeenCalledWith({ fileId: FILE_ID }, metadata);
      expect(response.file.id).toBe(FILE_ID);
    });

    it('should relay a domain error untouched', async () => {
      const domainError = { code: GrpcStatus.FAILED_PRECONDITION, details: '{"statusCode":422}' };
      jest.spyOn(storageService, 'confirmUpload').mockReturnValue(throwError(() => domainError));

      await expect(
        firstValueFrom(commandController.confirmUpload(user, FILE_ID, req)),
      ).rejects.toBe(domainError);
    });
  });

  describe('getFileMetadata', () => {
    it('should forward the query with the internal metadata and map the response', async () => {
      const spy = jest
        .spyOn(storageService, 'getFileMetadata')
        .mockReturnValue(of(createFileMetadataResponseFactory()));

      const response = await firstValueFrom(queryController.getFileMetadata(user, FILE_ID, req));

      expect(spy).toHaveBeenCalledWith({ fileId: FILE_ID }, metadata);
      expect(response.file.id).toBe(FILE_ID);
    });
  });
});

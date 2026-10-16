import { InternalServerErrorException } from '@nestjs/common';
import { FileMetadataDTO } from '../../../../modules/storage/dto/common/index.js';
import {
  ConfirmUploadResponseDTO,
  GenerateUploadUrlResponseDTO,
  GetFileMetadataResponseDTO,
} from '../../../../modules/storage/dto/response/index.js';
import {
  FILE_ID,
  createConfirmUploadResponseFactory,
  createFileMetadataFactory,
  createFileMetadataResponseFactory,
  createGenerateUploadUrlResponseFactory,
} from '../../../helpers/factories/storage.factory.js';

describe('storage response DTOs (Unit)', () => {
  it('should convert protobuf timestamps to dates and drop isPublic', () => {
    const dto = FileMetadataDTO.fromGrpc(createFileMetadataFactory());

    expect(dto.createdAt).toEqual(new Date(1_800_000_000 * 1000));
    expect(dto.uploadExpiresAt).toEqual(new Date(1_800_000_900 * 1000));
    expect(dto).not.toHaveProperty('isPublic');
  });

  it('should expose the public URL only when provided', () => {
    const dto = FileMetadataDTO.fromGrpc(
      createFileMetadataFactory({ publicUrl: 'https://cdn.example.test/a.jpg' }),
    );

    expect(dto.publicUrl).toBe('https://cdn.example.test/a.jpg');
  });

  it('should map the upload URL response', () => {
    const dto = GenerateUploadUrlResponseDTO.fromResponse(createGenerateUploadUrlResponseFactory());

    expect(dto.fileId).toBe(FILE_ID);
    expect(dto.uploadFields).toEqual({ key: `quarantine/${FILE_ID}`, policy: 'signed-policy' });
    expect(dto.expiresAt).toEqual(new Date(1_800_000_900 * 1000));
  });

  it('should map the confirm and metadata responses', () => {
    expect(
      ConfirmUploadResponseDTO.fromResponse(createConfirmUploadResponseFactory()).file.id,
    ).toBe(FILE_ID);
    expect(
      GetFileMetadataResponseDTO.fromResponse(createFileMetadataResponseFactory()).file.id,
    ).toBe(FILE_ID);
  });

  it('should fail when ms-storage returns no file', () => {
    expect(() => ConfirmUploadResponseDTO.fromResponse({ file: undefined })).toThrow(
      InternalServerErrorException,
    );
    expect(() => GetFileMetadataResponseDTO.fromResponse({ file: undefined })).toThrow(
      InternalServerErrorException,
    );
  });
});

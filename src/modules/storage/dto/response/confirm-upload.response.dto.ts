import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { ConfirmUploadResponse } from '@volontariapp/contracts-nest';
import type { ConfirmUploadWebResponse } from '@volontariapp/contracts';
import { FileMetadataDTO } from '../common/file-metadata.dto.js';

export class ConfirmUploadResponseDTO implements ConfirmUploadWebResponse {
  static fromResponse(response: ConfirmUploadResponse): ConfirmUploadResponseDTO {
    const dto = new ConfirmUploadResponseDTO();
    if (!response.file) {
      throw new InternalServerErrorException('Storage service returned no file metadata');
    }
    dto.file = FileMetadataDTO.fromGrpc(response.file);
    return dto;
  }

  @ApiProperty({ type: FileMetadataDTO, description: 'SCANNING (ASYNC) or final state (SYNC)' })
  file!: FileMetadataDTO;
}

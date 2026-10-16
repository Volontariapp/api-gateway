import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { FileMetadataResponse } from '@volontariapp/contracts-nest';
import type { FileMetadataWebResponse } from '@volontariapp/contracts';
import { FileMetadataDTO } from './file-metadata.response.dto.js';

export class FileMetadataResponseDTO implements FileMetadataWebResponse {
  static fromResponse(response: FileMetadataResponse): FileMetadataResponseDTO {
    const dto = new FileMetadataResponseDTO();
    if (!response.file) {
      throw new InternalServerErrorException('Storage service returned no file metadata');
    }
    dto.file = FileMetadataDTO.fromGrpc(response.file);
    return dto;
  }

  @ApiProperty({ type: FileMetadataDTO })
  file!: FileMetadataDTO;
}

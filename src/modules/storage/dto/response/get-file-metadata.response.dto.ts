import { InternalServerErrorException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import type { FileMetadataResponse } from '@volontariapp/contracts-nest';
import type { FileMetadataWebResponse } from '@volontariapp/contracts';
import { FileMetadataDTO } from '../common/file-metadata.dto.js';

export class GetFileMetadataResponseDTO implements FileMetadataWebResponse {
  static fromResponse(response: FileMetadataResponse): GetFileMetadataResponseDTO {
    const dto = new GetFileMetadataResponseDTO();
    if (!response.file) {
      throw new InternalServerErrorException('Storage service returned no file metadata');
    }
    dto.file = FileMetadataDTO.fromGrpc(response.file);
    return dto;
  }

  @ApiProperty({ type: FileMetadataDTO })
  file!: FileMetadataDTO;
}

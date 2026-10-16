import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GrpcDateMapper, type GenerateUploadUrlResponse } from '@volontariapp/contracts-nest';
import type { GenerateUploadUrlWebResponse } from '@volontariapp/contracts';

export class GenerateUploadUrlResponseDTO implements GenerateUploadUrlWebResponse {
  static fromResponse(response: GenerateUploadUrlResponse): GenerateUploadUrlResponseDTO {
    const dto = new GenerateUploadUrlResponseDTO();
    dto.fileId = response.fileId;
    dto.uploadUrl = response.uploadUrl;
    dto.uploadFields = response.uploadFields;
    dto.expiresAt = GrpcDateMapper.toDate(response.expiresAt);
    return dto;
  }

  @ApiProperty({ example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  fileId!: string;

  @ApiProperty({ description: 'Presigned POST target (quarantine bucket)' })
  uploadUrl!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Form fields to send with the multipart POST, before the file part',
  })
  uploadFields!: Record<string, string>;

  @ApiPropertyOptional({ type: Date })
  expiresAt?: Date;
}

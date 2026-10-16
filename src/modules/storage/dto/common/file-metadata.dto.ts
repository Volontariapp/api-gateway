import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EntityType,
  FileStatus,
  GrpcDateMapper,
  RejectionReason,
  ScanStatus,
  ValidationMode,
  type FileMetadata,
} from '@volontariapp/contracts-nest';
import type { FileMetadataDTO as FileMetadataWeb } from '@volontariapp/contracts';

export class FileMetadataDTO implements FileMetadataWeb {
  static fromGrpc(file: FileMetadata): FileMetadataDTO {
    const dto = new FileMetadataDTO();
    dto.id = file.id;
    dto.ownerId = file.ownerId;
    dto.objectKey = file.objectKey;
    dto.mimeType = file.mimeType;
    dto.status = file.status;
    dto.entityType = file.entityType;
    dto.entityId = file.entityId;
    dto.uploadExpiresAt = GrpcDateMapper.toDate(file.uploadExpiresAt);
    dto.createdAt = GrpcDateMapper.toDate(file.createdAt);
    dto.updatedAt = GrpcDateMapper.toDate(file.updatedAt);
    dto.scanStatus = file.scanStatus;
    dto.rejectionReason = file.rejectionReason;
    dto.publicUrl = file.publicUrl;
    dto.validationMode = file.validationMode;
    return dto;
  }

  @ApiProperty({ example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  id!: string;

  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  ownerId!: string;

  @ApiProperty({ description: 'Public object key when the scan is CLEAN, empty otherwise' })
  objectKey!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ enum: FileStatus })
  status!: FileStatus;

  @ApiPropertyOptional({ enum: EntityType })
  entityType?: EntityType;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional({ type: Date })
  uploadExpiresAt?: Date;

  @ApiPropertyOptional({ type: Date })
  createdAt?: Date;

  @ApiPropertyOptional({ type: Date })
  updatedAt?: Date;

  @ApiProperty({ enum: ScanStatus })
  scanStatus!: ScanStatus;

  @ApiPropertyOptional({ enum: RejectionReason })
  rejectionReason?: RejectionReason;

  @ApiPropertyOptional({ description: 'Set only when the scan is CLEAN' })
  publicUrl?: string;

  @ApiProperty({ enum: ValidationMode })
  validationMode!: ValidationMode;
}

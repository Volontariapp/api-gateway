import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { EntityType, type GenerateUploadUrlCommand } from '@volontariapp/contracts-nest';
import type { GenerateUploadUrlRequest } from '@volontariapp/contracts';

const UPLOADABLE_ENTITY_TYPES: readonly EntityType[] = [
  EntityType.ENTITY_TYPE_POST,
  EntityType.ENTITY_TYPE_USER_AVATAR,
  EntityType.ENTITY_TYPE_BADGE_ICON,
  EntityType.ENTITY_TYPE_EVENT_COVER,
];

export class GenerateUploadUrlRequestDTO implements GenerateUploadUrlRequest {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 1048576, description: 'Declared file size in bytes' })
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @ApiProperty({
    enum: UPLOADABLE_ENTITY_TYPES,
    example: EntityType.ENTITY_TYPE_USER_AVATAR,
    description: '1 POST, 2 USER_AVATAR, 3 BADGE_ICON, 4 EVENT_COVER',
  })
  @IsIn(UPLOADABLE_ENTITY_TYPES)
  entityType!: EntityType;

  toCommand(): GenerateUploadUrlCommand {
    return {
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      entityType: this.entityType,
      // Deprecated and ignored by ms-storage, but still required by its DTO.
      isPublic: false,
    };
  }
}

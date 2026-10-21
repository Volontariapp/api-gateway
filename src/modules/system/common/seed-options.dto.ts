import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum SeedPreset {
  QUICK = 'quick',
  STANDARD = 'standard',
  FIVE_HUNDRED = '500',
  MEGA_1000 = 'mega-1000',
}

export class SeedOptionsDTO {
  @ApiPropertyOptional({
    enum: SeedPreset,
    default: SeedPreset.STANDARD,
    description:
      'Preset de volumétrie : quick (10 users, ~5s), standard (100 users, ~25s), 500 (500 users / 500 events / 500 posts), mega-1000 (1000 users, ~2-3 min)',
  })
  @IsOptional()
  @IsEnum(SeedPreset)
  preset?: SeedPreset;

  @ApiPropertyOptional({
    description: "Nombre personnalisé d'utilisateurs (écrase le preset)",
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  userCount?: number;

  @ApiPropertyOptional({
    description: "Nombre personnalisé d'événements (écrase le preset)",
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  eventCount?: number;

  @ApiPropertyOptional({
    description: 'Nombre personnalisé de posts (écrase le preset)',
    example: 3500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  postCount?: number;

  @ApiPropertyOptional({
    description: 'Activer le téléversement de vraies images via ms-storage',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  seedMedia?: boolean;

  @ApiPropertyOptional({
    description: 'Concurrence maximale pour les opérations en lot',
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  concurrency?: number;
}

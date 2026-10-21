import { ApiProperty } from '@nestjs/swagger';

export class SeedCountStatsDTO {
  @ApiProperty({ example: 100 })
  success!: number;

  @ApiProperty({ example: 0 })
  failed!: number;
}

export class SeedStatusResponseDTO {
  @ApiProperty({ type: SeedCountStatsDTO })
  users!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  events!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  posts!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  comments!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  likes!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  participations!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  wishes!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  follows!: SeedCountStatsDTO;

  @ApiProperty({ type: SeedCountStatsDTO })
  media!: SeedCountStatsDTO;

  @ApiProperty({ example: 12500, description: 'Durée totale du seed en millisecondes' })
  durationMs!: number;
}

export function createInitialSeedStatus(): SeedStatusResponseDTO {
  return {
    users: { success: 0, failed: 0 },
    events: { success: 0, failed: 0 },
    posts: { success: 0, failed: 0 },
    comments: { success: 0, failed: 0 },
    likes: { success: 0, failed: 0 },
    participations: { success: 0, failed: 0 },
    wishes: { success: 0, failed: 0 },
    follows: { success: 0, failed: 0 },
    media: { success: 0, failed: 0 },
    durationMs: 0,
  };
}

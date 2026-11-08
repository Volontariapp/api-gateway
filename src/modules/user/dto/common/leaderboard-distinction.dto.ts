import { ApiProperty } from '@nestjs/swagger';
import { LeaderboardScope, type LeaderboardDistinction } from '@volontariapp/contracts-nest';

export class LeaderboardDistinctionDTO implements LeaderboardDistinction {
  @ApiProperty({
    enum: LeaderboardScope,
    description: '1 = global, 2 = week, 3 = month',
    example: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL,
  })
  scope!: LeaderboardScope;

  @ApiProperty({ description: 'Podium tier: 1 (first), 2 or 3', example: 1 })
  tier!: number;

  static fromDistinction(distinction: LeaderboardDistinction): LeaderboardDistinctionDTO {
    const dto = new LeaderboardDistinctionDTO();
    dto.scope = distinction.scope;
    dto.tier = distinction.tier;
    return dto;
  }
}

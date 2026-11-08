import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GetMyRankWebResponse } from '@volontariapp/contracts';
import type { GetMyRankResponse } from '@volontariapp/contracts-nest';
import { LeaderboardEntryDTO } from '../common/leaderboard-entry.dto.js';
import type { UserAvatarUrlBuilder } from '../common/user-avatar-url.builder.js';

export class GetMyRankResponseDTO implements GetMyRankWebResponse {
  static fromResponse(
    res: GetMyRankResponse,
    avatarUrls: UserAvatarUrlBuilder,
  ): GetMyRankResponseDTO {
    const dto = new GetMyRankResponseDTO();
    dto.me = res.me ? LeaderboardEntryDTO.fromEntry(res.me, avatarUrls) : undefined;
    dto.neighbors = res.neighbors.map((entry) => LeaderboardEntryDTO.fromEntry(entry, avatarUrls));
    return dto;
  }

  @ApiPropertyOptional({
    type: LeaderboardEntryDTO,
    description: 'Absent when the caller has no rank on this scope yet.',
  })
  me?: LeaderboardEntryDTO;

  @ApiProperty({
    type: [LeaderboardEntryDTO],
    description: 'Up to 5 entries above and 5 below the caller, ordered by rank.',
  })
  neighbors!: LeaderboardEntryDTO[];
}

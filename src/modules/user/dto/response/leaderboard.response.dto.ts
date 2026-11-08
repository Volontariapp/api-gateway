import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  GetLeaderboardWebResponse,
  GetMyRankWebResponse,
  LeaderboardEntryWeb,
} from '@volontariapp/contracts';
import {
  LeaderboardScope,
  type GetLeaderboardResponse,
  type GetMyRankResponse,
  type LeaderboardDistinction,
  type LeaderboardEntry,
} from '@volontariapp/contracts-nest';
import type { UserAvatarUrlBuilder } from '../common/user-avatar-url.builder.js';

export class LeaderboardDistinctionDTO implements LeaderboardDistinction {
  @ApiProperty({
    enum: LeaderboardScope,
    description: '1 = global, 2 = week, 3 = month',
    example: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL,
  })
  scope!: LeaderboardScope;

  @ApiProperty({ description: 'Podium tier: 1 (first), 2 or 3', example: 1 })
  tier!: number;
}

export class LeaderboardEntryDTO implements LeaderboardEntryWeb {
  static fromEntry(entry: LeaderboardEntry, avatarUrls: UserAvatarUrlBuilder): LeaderboardEntryDTO {
    const dto = new LeaderboardEntryDTO();
    dto.userId = entry.userId;
    dto.pseudo = entry.pseudo;
    dto.avatarFileId = entry.avatarFileId;
    dto.avatarUrl = avatarUrls.forUserAvatar(entry.avatarFileId);
    dto.points = entry.points;
    dto.rank = entry.rank;
    dto.distinctions = entry.distinctions.map((d) => ({ scope: d.scope, tier: d.tier }));
    return dto;
  }

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  pseudo!: string;

  @ApiPropertyOptional()
  avatarFileId?: string;

  @ApiPropertyOptional({ description: 'Public URL of the avatar, absent when there is none.' })
  avatarUrl?: string;

  @ApiProperty()
  points!: number;

  @ApiProperty({ description: 'Ties share the same rank.' })
  rank!: number;

  @ApiProperty({ type: [LeaderboardDistinctionDTO] })
  distinctions!: LeaderboardDistinctionDTO[];
}

export class GetLeaderboardResponseDTO implements GetLeaderboardWebResponse {
  static fromResponse(
    res: GetLeaderboardResponse,
    avatarUrls: UserAvatarUrlBuilder,
  ): GetLeaderboardResponseDTO {
    const dto = new GetLeaderboardResponseDTO();
    dto.entries = res.entries.map((entry) => LeaderboardEntryDTO.fromEntry(entry, avatarUrls));
    dto.nextCursor = res.nextCursor;
    return dto;
  }

  @ApiProperty({ type: [LeaderboardEntryDTO] })
  entries!: LeaderboardEntryDTO[];

  @ApiPropertyOptional({ description: 'Absent when there is no further page.' })
  nextCursor?: string;
}

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

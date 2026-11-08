import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GetLeaderboardWebResponse } from '@volontariapp/contracts';
import type { GetLeaderboardResponse } from '@volontariapp/contracts-nest';
import { LeaderboardEntryDTO } from '../common/leaderboard-entry.dto.js';
import type { UserAvatarUrlBuilder } from '../common/user-avatar-url.builder.js';

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

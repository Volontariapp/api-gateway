import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LeaderboardEntryWeb } from '@volontariapp/contracts';
import type { LeaderboardEntry } from '@volontariapp/contracts-nest';
import { LeaderboardDistinctionDTO } from './leaderboard-distinction.dto.js';
import type { UserAvatarUrlBuilder } from './user-avatar-url.builder.js';

export class LeaderboardEntryDTO implements LeaderboardEntryWeb {
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

  static fromEntry(entry: LeaderboardEntry, avatarUrls: UserAvatarUrlBuilder): LeaderboardEntryDTO {
    const dto = new LeaderboardEntryDTO();
    dto.userId = entry.userId;
    dto.pseudo = entry.pseudo;
    dto.avatarFileId = entry.avatarFileId;
    dto.avatarUrl = avatarUrls.forUserAvatar(entry.avatarFileId);
    dto.points = entry.points;
    dto.rank = entry.rank;
    dto.distinctions = entry.distinctions.map((d) => LeaderboardDistinctionDTO.fromDistinction(d));
    return dto;
  }
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { GetLeaderboardRequest, LeaderboardScopeWeb } from '@volontariapp/contracts';
import type { GetLeaderboardQuery } from '@volontariapp/contracts-nest';
import {
  LEADERBOARD_REST_DEFAULT_LIMIT,
  LEADERBOARD_REST_MAX_LIMIT,
  LEADERBOARD_SCOPES,
  toLeaderboardScope,
} from '../common/leaderboard-scope.js';

/** GET /users/leaderboard */
export class GetLeaderboardRequestDTO implements GetLeaderboardRequest {
  @ApiPropertyOptional({
    enum: LEADERBOARD_SCOPES,
    default: 'global',
    description:
      'global: total points of all time. week: points earned since Monday 00:00 (Europe/Paris). month: points earned since the 1st at 00:00 (Europe/Paris).',
  })
  @IsOptional()
  @IsIn(LEADERBOARD_SCOPES)
  scope?: LeaderboardScopeWeb;

  @ApiPropertyOptional({
    description:
      'Opaque cursor returned as nextCursor by the previous page. Omit for the first page.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    default: LEADERBOARD_REST_DEFAULT_LIMIT,
    minimum: 1,
    maximum: LEADERBOARD_REST_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEADERBOARD_REST_MAX_LIMIT)
  limit?: number;

  toQuery(): GetLeaderboardQuery {
    return {
      scope: toLeaderboardScope(this.scope),
      cursor: this.cursor,
      limit: this.limit ?? LEADERBOARD_REST_DEFAULT_LIMIT,
    };
  }
}

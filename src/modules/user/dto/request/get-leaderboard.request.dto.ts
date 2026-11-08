import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  LeaderboardScope,
  type GetLeaderboardQuery,
  type GetMyRankQuery,
} from '@volontariapp/contracts-nest';

/** Periode du classement exposee en REST. */
export enum LeaderboardScopeParam {
  GLOBAL = 'global',
  WEEK = 'week',
  MONTH = 'month',
}

export const LEADERBOARD_REST_MAX_LIMIT = 100;
export const LEADERBOARD_REST_DEFAULT_LIMIT = 20;

const SCOPE_BY_PARAM: Record<LeaderboardScopeParam, LeaderboardScope> = {
  [LeaderboardScopeParam.GLOBAL]: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL,
  [LeaderboardScopeParam.WEEK]: LeaderboardScope.LEADERBOARD_SCOPE_WEEK,
  [LeaderboardScopeParam.MONTH]: LeaderboardScope.LEADERBOARD_SCOPE_MONTH,
};

export function toLeaderboardScope(param?: LeaderboardScopeParam): LeaderboardScope {
  return SCOPE_BY_PARAM[param ?? LeaderboardScopeParam.GLOBAL];
}

/** GET /users/leaderboard */
export class GetLeaderboardRequestDTO {
  @ApiPropertyOptional({
    enum: LeaderboardScopeParam,
    default: LeaderboardScopeParam.GLOBAL,
    description:
      'global: total points of all time. week: points earned since Monday 00:00 (Europe/Paris). month: points earned since the 1st at 00:00 (Europe/Paris).',
  })
  @IsOptional()
  @IsEnum(LeaderboardScopeParam)
  scope?: LeaderboardScopeParam;

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

/** GET /users/me/rank */
export class GetMyRankRequestDTO {
  @ApiPropertyOptional({ enum: LeaderboardScopeParam, default: LeaderboardScopeParam.GLOBAL })
  @IsOptional()
  @IsEnum(LeaderboardScopeParam)
  scope?: LeaderboardScopeParam;

  toQuery(): GetMyRankQuery {
    return { scope: toLeaderboardScope(this.scope) };
  }
}

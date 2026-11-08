import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { GetMyRankRequest, LeaderboardScopeWeb } from '@volontariapp/contracts';
import type { GetMyRankQuery } from '@volontariapp/contracts-nest';
import { LEADERBOARD_SCOPES, toLeaderboardScope } from '../common/leaderboard-scope.js';

/** GET /users/me/rank. The user comes from the internal token. */
export class GetMyRankRequestDTO implements GetMyRankRequest {
  @ApiPropertyOptional({ enum: LEADERBOARD_SCOPES, default: 'global' })
  @IsOptional()
  @IsIn(LEADERBOARD_SCOPES)
  scope?: LeaderboardScopeWeb;

  toQuery(): GetMyRankQuery {
    return { scope: toLeaderboardScope(this.scope) };
  }
}

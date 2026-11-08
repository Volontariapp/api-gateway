import type { LeaderboardScopeWeb } from '@volontariapp/contracts';
import { LeaderboardScope } from '@volontariapp/contracts-nest';

export const LEADERBOARD_SCOPES: readonly LeaderboardScopeWeb[] = ['global', 'week', 'month'];

export const LEADERBOARD_REST_MAX_LIMIT = 100;
export const LEADERBOARD_REST_DEFAULT_LIMIT = 20;

const SCOPE_BY_WEB: Record<LeaderboardScopeWeb, LeaderboardScope> = {
  global: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL,
  week: LeaderboardScope.LEADERBOARD_SCOPE_WEEK,
  month: LeaderboardScope.LEADERBOARD_SCOPE_MONTH,
};

/** Periode REST vers periode gRPC. Sans periode, le classement global. */
export function toLeaderboardScope(scope?: LeaderboardScopeWeb): LeaderboardScope {
  return SCOPE_BY_WEB[scope ?? 'global'];
}

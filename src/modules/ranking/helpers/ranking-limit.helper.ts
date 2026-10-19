import { RANKING_DEFAULT_LIMIT, RANKING_MAX_LIMIT } from '../constants/ranking.constants.js';

/** A missing or invalid limit becomes the default; a larger one is capped, never rejected. */
export function clampRankingLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit) || limit < 1) {
    return RANKING_DEFAULT_LIMIT;
  }
  return Math.min(limit, RANKING_MAX_LIMIT);
}

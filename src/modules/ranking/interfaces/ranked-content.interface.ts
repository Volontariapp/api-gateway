import type { RankingItemOnWire } from '../types/ranking-wire.type.js';

/** A content (event or post) paired with the ranking line that placed it. */
export interface RankedContent<T> {
  item: RankingItemOnWire;
  content: T;
}

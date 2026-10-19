import type { RankedContent } from '../interfaces/ranked-content.interface.js';
import type { RankingItemOnWire } from '../types/ranking-wire.type.js';

/**
 * Puts the contents back in the order of the ranking (content services do not keep the order of
 * the ids they receive) and drops the ids for which no content came back.
 */
export function orderByRanking<T extends { id: string }>(
  items: readonly RankingItemOnWire[],
  contents: readonly T[],
): RankedContent<T>[] {
  const byId = new Map(contents.map((content) => [content.id, content]));
  return items.flatMap((item) => {
    const content = byId.get(item.id);
    return content === undefined ? [] : [{ item, content }];
  });
}

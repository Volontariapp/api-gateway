import { Injectable, Optional } from '@nestjs/common';
import { finalize, type MonoTypeOperatorFunction } from 'rxjs';
import type { GetSearchExclusionsResponse } from '@volontariapp/contracts';
import { TtlLruCache } from '../../../common/cache/ttl-lru-cache.js';
import { CacheStatsReporter } from '../../../common/cache/cache-stats.reporter.js';

/** The `exclude*` filters of an event search, as sent to GetSearchExclusions. */
export interface SearchExclusionFlags {
  readonly excludeCreatedByMe: boolean;
  readonly excludeParticipatedByMe: boolean;
  readonly excludeWishedByMe: boolean;
  readonly excludeBlockedUsers: boolean;
}

/**
 * A change of someone's exclusions (block, participation, wish) can take up to 5 s to show in the
 * event list served by another gateway pod (Lead Dev decision D1, load plan C2). The pod that
 * handles the change forgets the keys at once.
 */
export const SEARCH_EXCLUSIONS_TTL_MS = 5_000;

/**
 * Entries per gateway pod. At 300 req/s, 40 % of them on the app event list, spread over 5 pods,
 * about 120 distinct users read the list in a 5 s window on one pod: 1000 holds that working set
 * and the 1000 actors of the load simulator, while bounding memory (see the per-entry cap).
 */
export const SEARCH_EXCLUSIONS_CACHE_SIZE = 1_000;

/**
 * A response holding more ids is not kept: 1000 entries of at most 250 UUIDs stay around 15 MB
 * (about 60 bytes per id), within the margin of a 320 Mi pod measured near 200 Mi under load.
 */
export const MAX_CACHED_EXCLUSION_IDS = 250;

const FLAG_COMBINATIONS = 16;

/**
 * Per-process cache of GetSearchExclusions, keyed by user and flags (the response depends on
 * both). One instance is shared by the event list, which reads it, and by the social command
 * routes, which invalidate the users whose exclusions they change.
 */
@Injectable()
export class SearchExclusionsCache {
  private readonly cache = new TtlLruCache<GetSearchExclusionsResponse>(
    SEARCH_EXCLUSIONS_CACHE_SIZE,
    SEARCH_EXCLUSIONS_TTL_MS,
    undefined,
    'search-exclusions',
  );

  constructor(@Optional() cacheStats?: CacheStatsReporter) {
    cacheStats?.register(this.cache);
  }

  get(userId: string, flags: SearchExclusionFlags): GetSearchExclusionsResponse | undefined {
    return this.cache.get(SearchExclusionsCache.key(userId, SearchExclusionsCache.mask(flags)));
  }

  /** Called with a successful response only: an error never reaches this point. */
  set(userId: string, flags: SearchExclusionFlags, response: GetSearchExclusionsResponse): void {
    const ids = response.excludedEventIds.length + response.hiddenUserIds.length;
    if (ids > MAX_CACHED_EXCLUSION_IDS) return;
    this.cache.set(SearchExclusionsCache.key(userId, SearchExclusionsCache.mask(flags)), response);
  }

  /** Forgets every flag combination of these users on this pod. */
  invalidate(...userIds: string[]): void {
    for (const userId of userIds) {
      for (let mask = 0; mask < FLAG_COMBINATIONS; mask += 1) {
        this.cache.delete(SearchExclusionsCache.key(userId, mask));
      }
    }
  }

  /**
   * Pipe of a command that changes these users' exclusions: forgets them when the call ends, on
   * success and on failure alike (a timed-out write may still have been applied). A list read on
   * this pod while the write is in flight can store the old value again, for at most 5 s.
   */
  invalidateAfter<T>(...userIds: string[]): MonoTypeOperatorFunction<T> {
    return finalize(() => {
      this.invalidate(...userIds);
    });
  }

  private static mask(flags: SearchExclusionFlags): number {
    return (
      (flags.excludeCreatedByMe ? 1 : 0) |
      (flags.excludeParticipatedByMe ? 2 : 0) |
      (flags.excludeWishedByMe ? 4 : 0) |
      (flags.excludeBlockedUsers ? 8 : 0)
    );
  }

  private static key(userId: string, mask: number): string {
    return `${userId}:${String(mask)}`;
  }
}

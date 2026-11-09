/** Counters of one cache over the current reporting window, plus its current fill. */
export interface CacheStats {
  readonly name: string;
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
  readonly size: number;
  readonly capacity: number;
}

/** A cache the reporter can read and whose counters it can restart. */
export interface CacheStatsSource {
  stats(): CacheStats;
  resetStats(): void;
}

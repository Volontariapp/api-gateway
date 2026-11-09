import type { CacheStats, CacheStatsSource } from './cache-stats.js';

/**
 * Small in-memory cache with a time to live and a hard capacity, for lookups that do not depend on
 * the caller. Memory is bounded: at most `maxEntries` values, the least recently used one leaves
 * first, and an expired entry is dropped when it is read. One instance per process: with several
 * gateway pods each pod keeps its own copy, so a value can be up to `ttlMs` old on every pod.
 */
export class TtlLruCache<V> implements CacheStatsSource {
  // A Map iterates in insertion order: the first key is the least recently used one.
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();

  // Plain counters, reset by the stats reporter every minute.
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
    private readonly now: () => number = () => Date.now(),
    private readonly name: string = 'ttl-lru-cache',
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error(`maxEntries must be an integer >= 1, got ${String(maxEntries)}`);
    }
    if (!(ttlMs > 0)) {
      throw new Error(`ttlMs must be > 0, got ${String(ttlMs)}`);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      this.misses++;
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    // Re-insert to mark the entry as the most recently used one.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done === true) break;
      this.entries.delete(oldest.value);
      this.evictions++;
    }
  }

  /** Forgets a key, for a value known to be stale. Not counted as a read nor as an eviction. */
  delete(key: string): void {
    this.entries.delete(key);
  }

  stats(): CacheStats {
    return {
      name: this.name,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.entries.size,
      capacity: this.maxEntries,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}

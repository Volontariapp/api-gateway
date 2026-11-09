import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import type { CacheStatsSource } from './cache-stats.js';

export const CACHE_STATS_INTERVAL_MS = 60_000;

/**
 * Logs one `cache stats` line per registered cache every minute, then restarts its counters, so
 * each line is a per-minute count. A cache that was not read during the minute logs nothing.
 */
@Injectable()
export class CacheStatsReporter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger({ context: CacheStatsReporter.name });
  private readonly sources: CacheStatsSource[] = [];
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly intervalMs: number = CACHE_STATS_INTERVAL_MS) {}

  register(source: CacheStatsSource): void {
    this.sources.push(source);
  }

  onModuleInit(): void {
    if (this.timer !== undefined) return;
    this.timer = setInterval(() => {
      this.report();
    }, this.intervalMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer === undefined) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  report(): void {
    for (const source of this.sources) {
      const { name, hits, misses, evictions, size, capacity } = source.stats();
      source.resetStats();
      const reads = hits + misses;
      if (reads === 0) continue;
      this.logger.info('cache stats', {
        name,
        hits,
        misses,
        hitRate: Number((hits / reads).toFixed(3)),
        evictions,
        size,
        capacity,
      });
    }
  }
}

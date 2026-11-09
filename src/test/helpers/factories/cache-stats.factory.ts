import type { CacheStats } from '../../../common/cache/cache-stats.js';

export class CacheStatsFactory {
  static create(overrides: Partial<CacheStats> = {}): CacheStats {
    return {
      name: 'test-cache',
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      capacity: 10,
      ...overrides,
    };
  }
}

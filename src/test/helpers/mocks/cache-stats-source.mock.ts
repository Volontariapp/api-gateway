import { jest } from '@jest/globals';
import type { CacheStats, CacheStatsSource } from '../../../common/cache/cache-stats.js';

export interface MockCacheStatsSource extends CacheStatsSource {
  readonly statsSpy: jest.Mock<CacheStatsSource['stats']>;
  readonly resetSpy: jest.Mock<CacheStatsSource['resetStats']>;
}

/** A cache stand-in that serves fixed stats and records the counter resets. */
export const createCacheStatsSourceMock = (stats: CacheStats): MockCacheStatsSource => {
  const statsSpy = jest.fn<CacheStatsSource['stats']>(() => stats);
  const resetSpy = jest.fn<CacheStatsSource['resetStats']>();
  return { stats: statsSpy, resetStats: resetSpy, statsSpy, resetSpy };
};

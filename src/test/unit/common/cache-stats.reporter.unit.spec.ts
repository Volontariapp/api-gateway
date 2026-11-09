import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Logger } from '@volontariapp/logger';
import {
  CACHE_STATS_INTERVAL_MS,
  CacheStatsReporter,
} from '../../../common/cache/cache-stats.reporter.js';
import { CacheStatsFactory } from '../../helpers/factories/cache-stats.factory.js';
import { createCacheStatsSourceMock } from '../../helpers/mocks/cache-stats-source.mock.js';

describe('CacheStatsReporter (Unit)', () => {
  let reporter: CacheStatsReporter;
  let info: jest.SpiedFunction<Logger['info']>;

  beforeEach(() => {
    jest.useFakeTimers();
    info = jest.spyOn(Logger.prototype, 'info').mockImplementation(() => undefined);
    reporter = new CacheStatsReporter();
  });

  afterEach(() => {
    reporter.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should log one line per active cache every interval, then reset its counters', () => {
    const source = createCacheStatsSourceMock(
      CacheStatsFactory.create({
        name: 'a',
        hits: 3,
        misses: 1,
        evictions: 2,
        size: 4,
        capacity: 8,
      }),
    );
    reporter.register(source);
    reporter.onModuleInit();

    jest.advanceTimersByTime(CACHE_STATS_INTERVAL_MS);

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('cache stats', {
      name: 'a',
      hits: 3,
      misses: 1,
      hitRate: 0.75,
      evictions: 2,
      size: 4,
      capacity: 8,
    });
    expect(source.resetSpy).toHaveBeenCalledTimes(1);
  });

  it('should round the hit rate to 3 decimals', () => {
    reporter.register(createCacheStatsSourceMock(CacheStatsFactory.create({ hits: 1, misses: 2 })));

    reporter.report();

    expect(info).toHaveBeenCalledWith('cache stats', expect.objectContaining({ hitRate: 0.333 }));
  });

  it('should log nothing when a cache had neither hits nor misses, but still reset it', () => {
    const source = createCacheStatsSourceMock(CacheStatsFactory.create());
    reporter.register(source);
    reporter.onModuleInit();

    jest.advanceTimersByTime(CACHE_STATS_INTERVAL_MS * 3);

    expect(info).not.toHaveBeenCalled();
    expect(source.resetSpy).toHaveBeenCalledTimes(3);
  });

  it('should report each cache on its own line', () => {
    reporter.register(createCacheStatsSourceMock(CacheStatsFactory.create({ name: 'a', hits: 1 })));
    reporter.register(
      createCacheStatsSourceMock(CacheStatsFactory.create({ name: 'b', misses: 1 })),
    );

    reporter.report();

    expect(info).toHaveBeenCalledTimes(2);
  });

  it('should stop reporting once destroyed', () => {
    reporter.register(createCacheStatsSourceMock(CacheStatsFactory.create({ hits: 1 })));
    reporter.onModuleInit();
    expect(jest.getTimerCount()).toBe(1);

    reporter.onModuleDestroy();
    jest.advanceTimersByTime(CACHE_STATS_INTERVAL_MS * 2);

    expect(jest.getTimerCount()).toBe(0);
    expect(info).not.toHaveBeenCalled();
  });

  it('should not start a second timer when initialised twice', () => {
    reporter.onModuleInit();
    reporter.onModuleInit();

    expect(jest.getTimerCount()).toBe(1);
  });
});

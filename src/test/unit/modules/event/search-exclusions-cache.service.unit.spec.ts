import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  MAX_CACHED_EXCLUSION_IDS,
  SEARCH_EXCLUSIONS_TTL_MS,
  SearchExclusionsCache,
} from '../../../../modules/event/services/search-exclusions-cache.service.js';
import { CacheStatsReporter } from '../../../../common/cache/cache-stats.reporter.js';
import { SearchExclusionsFactory } from '../../../helpers/factories/search-exclusions.factory.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('SearchExclusionsCache (Unit)', () => {
  const userId = 'user-1';
  const otherUserId = 'user-2';
  const flags = SearchExclusionsFactory.createFlags();
  const response = SearchExclusionsFactory.createResponse({
    excludedEventIds: IdsPageFactory.createIds(2),
    hiddenUserIds: IdsPageFactory.createIds(1, 9),
  });
  let clock: jest.SpiedFunction<typeof Date.now>;
  let cache: SearchExclusionsCache;

  beforeEach(() => {
    clock = jest.spyOn(Date, 'now').mockReturnValue(10_000);
    cache = new SearchExclusionsCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a stored response for the same user and flags', () => {
    cache.set(userId, flags, response);

    expect(cache.get(userId, flags)).toBe(response);
  });

  it('should keep the responses of different users and flags apart', () => {
    cache.set(userId, flags, response);

    expect(cache.get(otherUserId, flags)).toBeUndefined();
    expect(cache.get(userId, { ...flags, excludeBlockedUsers: false })).toBeUndefined();
  });

  it('should drop a response after 5 s', () => {
    cache.set(userId, flags, response);

    clock.mockReturnValue(10_000 + SEARCH_EXCLUSIONS_TTL_MS - 1);
    expect(cache.get(userId, flags)).toBe(response);

    clock.mockReturnValue(10_000 + SEARCH_EXCLUSIONS_TTL_MS);
    expect(cache.get(userId, flags)).toBeUndefined();
  });

  it('should forget every flag combination of the invalidated users only', () => {
    const blockedOnly = SearchExclusionsFactory.createFlags({
      excludeCreatedByMe: false,
      excludeParticipatedByMe: false,
      excludeWishedByMe: false,
    });
    cache.set(userId, flags, response);
    cache.set(userId, blockedOnly, response);
    cache.set(otherUserId, flags, response);
    cache.set('user-3', flags, response);

    cache.invalidate(userId, otherUserId);

    expect(cache.get(userId, flags)).toBeUndefined();
    expect(cache.get(userId, blockedOnly)).toBeUndefined();
    expect(cache.get(otherUserId, flags)).toBeUndefined();
    expect(cache.get('user-3', flags)).toBe(response);
  });

  it('should not keep a response holding more ids than its per-entry cap', () => {
    const large = SearchExclusionsFactory.createResponse({
      excludedEventIds: IdsPageFactory.createIds(MAX_CACHED_EXCLUSION_IDS),
      hiddenUserIds: IdsPageFactory.createIds(1, MAX_CACHED_EXCLUSION_IDS),
    });

    cache.set(userId, flags, large);

    expect(cache.get(userId, flags)).toBeUndefined();
  });

  it('should register its counters with the stats reporter', () => {
    const reporter = new CacheStatsReporter();
    const registerSpy = jest.spyOn(reporter, 'register');

    new SearchExclusionsCache(reporter);

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ stats: expect.any(Function) }),
    );
  });
});

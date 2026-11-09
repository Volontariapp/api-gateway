import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { TtlLruCache } from '../../../common/cache/ttl-lru-cache.js';

describe('TtlLruCache (Unit)', () => {
  let now = 1_000;
  const clock = () => now;
  const build = (maxEntries = 3, ttlMs = 100) => new TtlLruCache<string>(maxEntries, ttlMs, clock);

  afterEach(() => {
    now = 1_000;
    jest.restoreAllMocks();
  });

  it('should return undefined for an unknown key and the stored value otherwise', () => {
    const cache = build();

    expect(cache.get('a')).toBeUndefined();
    cache.set('a', 'value-a');

    expect(cache.get('a')).toBe('value-a');
  });

  it('should drop an entry once its time to live has passed', () => {
    const cache = build(3, 100);
    cache.set('a', 'value-a');

    now += 99;
    expect(cache.get('a')).toBe('value-a');

    now += 2;
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('should restart the time to live when a key is set again', () => {
    const cache = build(3, 100);
    cache.set('a', 'old');
    now += 80;

    cache.set('a', 'new');
    now += 80;

    expect(cache.get('a')).toBe('new');
  });

  it('should evict the least recently used entry when it is full', () => {
    const cache = build(2);
    cache.set('a', 'value-a');
    cache.set('b', 'value-b');

    cache.set('c', 'value-c');

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('value-b');
    expect(cache.get('c')).toBe('value-c');
  });

  it('should count a read as a use so the read entry survives the eviction', () => {
    const cache = build(2);
    cache.set('a', 'value-a');
    cache.set('b', 'value-b');
    cache.get('a');

    cache.set('c', 'value-c');

    expect(cache.get('a')).toBe('value-a');
    expect(cache.get('b')).toBeUndefined();
  });

  it('should forget a deleted key without counting a read or an eviction', () => {
    const cache = build();
    cache.set('a', 'value-a');
    cache.set('b', 'value-b');

    cache.delete('a');
    cache.delete('unknown');

    expect(cache.size).toBe(1);
    expect(cache.stats()).toEqual(expect.objectContaining({ hits: 0, misses: 0, evictions: 0 }));
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('value-b');
  });

  it('should never hold more entries than its capacity', () => {
    const cache = build(5);

    for (let i = 0; i < 100; i += 1) {
      cache.set(`key-${String(i)}`, 'v');
    }

    expect(cache.size).toBe(5);
  });

  it('should use Date.now as the default clock', () => {
    const spy = jest.spyOn(Date, 'now').mockReturnValue(5_000);
    const cache = new TtlLruCache<string>(2, 100);
    cache.set('a', 'value-a');

    spy.mockReturnValue(5_050);
    expect(cache.get('a')).toBe('value-a');

    spy.mockReturnValue(5_101);
    expect(cache.get('a')).toBeUndefined();
  });

  it('should refuse a capacity below one or a non positive time to live', () => {
    expect(() => new TtlLruCache<string>(0, 100)).toThrow(/maxEntries/);
    expect(() => new TtlLruCache<string>(1, 0)).toThrow(/ttlMs/);
  });

  describe('stats', () => {
    it('should count hits, misses (unknown and expired keys) and evictions', () => {
      const cache = build(2, 100);
      cache.get('a');
      cache.set('a', '1');
      cache.get('a');
      cache.get('a');
      cache.set('b', '2');
      cache.set('c', '3');
      now += 101;
      cache.get('b');

      expect(cache.stats()).toEqual({
        name: 'ttl-lru-cache',
        hits: 2,
        misses: 2,
        evictions: 1,
        size: 1,
        capacity: 2,
      });
    });

    it('should expose the configured name and restart the counters on reset', () => {
      const cache = new TtlLruCache<string>(2, 100, clock, 'named');
      cache.set('a', '1');
      cache.get('a');
      cache.get('x');

      cache.resetStats();

      expect(cache.stats()).toEqual({
        name: 'named',
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 1,
        capacity: 2,
      });
    });
  });
});

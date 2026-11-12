import {
  cut,
  isFaultInjectionAvailable,
  proxyName,
  restore,
  restoreAll,
  slow,
  withCut,
} from './network-fault.helper.js';
import { startFakeToxiproxy, type FakeToxiproxy } from './network-fault.mock.js';

const POST_STORAGE = 'ms-post__ms-storage';
const EVENT_STORAGE = 'ms-event__ms-storage';

/**
 * Offline test of the fault injection helper against a fake Toxiproxy HTTP server: it needs no
 * stack, so it runs in the parallel pass without touching a real link.
 */
describe('network-fault helper', () => {
  const initialUrl = process.env.TOXIPROXY_URL;
  let fake: FakeToxiproxy;

  beforeEach(async () => {
    fake = await startFakeToxiproxy([POST_STORAGE, EVENT_STORAGE], {
      [POST_STORAGE]: ['slow', 'other'],
    });
    process.env.TOXIPROXY_URL = fake.url;
  });

  afterEach(async () => {
    if (initialUrl === undefined) {
      delete process.env.TOXIPROXY_URL;
    } else {
      process.env.TOXIPROXY_URL = initialUrl;
    }
    await fake.close();
  });

  it('names a proxy <from>__<to>', () => {
    expect(proxyName('ms-post', 'ms-storage')).toBe(POST_STORAGE);
  });

  it('cut and restore post the enabled flag as JSON on the proxy', async () => {
    await cut('ms-post', 'ms-storage');
    await restore('ms-post', 'ms-storage');

    expect(fake.requests.map((r) => [r.method, r.url, r.contentType, r.body])).toEqual([
      ['POST', `/proxies/${POST_STORAGE}`, 'application/json', '{"enabled":false}'],
      ['POST', `/proxies/${POST_STORAGE}`, 'application/json', '{"enabled":true}'],
    ]);
  });

  it('slow replaces a previous delay with a downstream latency toxic', async () => {
    await slow('ms-post', 'ms-storage', 3000);

    expect(fake.requests.map((r) => [r.method, r.url])).toEqual([
      ['DELETE', `/proxies/${POST_STORAGE}/toxics/slow`],
      ['POST', `/proxies/${POST_STORAGE}/toxics`],
    ]);
    expect(JSON.parse(fake.requests[1].body)).toEqual({
      name: 'slow',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1,
      attributes: { latency: 3000 },
    });
  });

  it('withCut returns the result and restores the link', async () => {
    const result = await withCut('ms-post', 'ms-storage', () => Promise.resolve(42));

    expect(result).toBe(42);
    expect(fake.requests.map((r) => r.body)).toEqual(['{"enabled":false}', '{"enabled":true}']);
  });

  it('withCut restores the link when the callback throws', async () => {
    await expect(
      withCut('ms-post', 'ms-storage', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(fake.requests.map((r) => r.body)).toEqual(['{"enabled":false}', '{"enabled":true}']);
  });

  it('reports the status and body when toxiproxy refuses a call', async () => {
    fake.failWith(`/proxies/${POST_STORAGE}`, 404);

    await expect(cut('ms-post', 'ms-storage')).rejects.toThrow(/404.*forced failure/);
  });

  it('restoreAll re-enables every proxy and removes every toxic', async () => {
    await restoreAll();

    const writes = fake.requests
      .filter((r) => r.method !== 'GET')
      .map((r) => [r.method, r.url, r.body]);
    expect(writes).toEqual([
      ['POST', `/proxies/${POST_STORAGE}`, '{"enabled":true}'],
      ['DELETE', `/proxies/${POST_STORAGE}/toxics/slow`, ''],
      ['DELETE', `/proxies/${POST_STORAGE}/toxics/other`, ''],
      ['POST', `/proxies/${EVENT_STORAGE}`, '{"enabled":true}'],
    ]);
  });

  it('fails clearly when TOXIPROXY_URL is absent', async () => {
    delete process.env.TOXIPROXY_URL;

    expect(isFaultInjectionAvailable()).toBe(false);
    await expect(cut('ms-post', 'ms-storage')).rejects.toThrow(/TOXIPROXY_URL is not set/);
  });
});

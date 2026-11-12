/**
 * Fault injection between two services of the E2E stack, through the HTTP API of Toxiproxy
 * (ci-tools, `toxiproxy/proxies.json`). Each link is a TCP relay named `<from>__<to>`: the caller
 * reaches the callee through it, so cutting or slowing the relay cuts or slows that link only.
 *
 * A cut link is cut for EVERY test running at that moment: the suites that use this helper live in
 * `e2e/faults/` and run alone, after the parallel pass (see `scripts/run-e2e.sh`).
 *
 * After `restore`, the gRPC client of the caller reconnects with a delay of about 1 s (measured
 * with a plain `@grpc/grpc-js` client): never call the callee right away, wait with `eventually`.
 */

const SLOW_TOXIC_NAME = 'slow';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

type HttpMethod = 'GET' | 'POST' | 'DELETE';

/** Name of the relay between `from` (the caller) and `to` (the callee). */
export function proxyName(from: string, to: string): string {
  return `${from}__${to}`;
}

function toxiproxyUrl(): string {
  const url = process.env.TOXIPROXY_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'TOXIPROXY_URL is not set: the stack has no toxiproxy (ci-tools compose with toxiproxy needed)',
    );
  }
  return url.replace(/\/+$/, '');
}

interface ToxiproxyResponse {
  readonly status: number;
  readonly body: string;
}

async function call(
  method: HttpMethod,
  path: string,
  payload?: unknown,
  tolerated: readonly number[] = [],
): Promise<ToxiproxyResponse> {
  const target = `${toxiproxyUrl()}${path}`;
  const res = await fetch(target, {
    method,
    headers: payload === undefined ? undefined : JSON_HEADERS,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const body = await res.text();
  if (!res.ok && !tolerated.includes(res.status)) {
    throw new Error(`toxiproxy ${method} ${path} answered ${String(res.status)}: ${body}`);
  }
  return { status: res.status, body };
}

function parseJson(body: string): unknown {
  return JSON.parse(body) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function proxyPath(from: string, to: string): string {
  return `/proxies/${encodeURIComponent(proxyName(from, to))}`;
}

async function setEnabled(from: string, to: string, enabled: boolean): Promise<void> {
  await call('POST', proxyPath(from, to), { enabled });
}

/** Cuts the link: the caller gets `UNAVAILABLE` within a few milliseconds. */
export async function cut(from: string, to: string): Promise<void> {
  await setEnabled(from, to, false);
}

/** Re-opens a cut link (see the reconnection delay in the header). */
export async function restore(from: string, to: string): Promise<void> {
  await setEnabled(from, to, true);
}

/**
 * Delays every answer of the callee by `latencyMs`. Above the deadline of the call the caller gets
 * `DEADLINE_EXCEEDED`. Replaces a previous `slow` on the same link; `clearSlow` removes it.
 */
export async function slow(from: string, to: string, latencyMs: number): Promise<void> {
  await clearSlow(from, to);
  await call('POST', `${proxyPath(from, to)}/toxics`, {
    name: SLOW_TOXIC_NAME,
    type: 'latency',
    stream: 'downstream',
    toxicity: 1.0,
    attributes: { latency: latencyMs },
  });
}

/** Removes the delay set by `slow`; nothing to do when there is none. */
export async function clearSlow(from: string, to: string): Promise<void> {
  await call('DELETE', `${proxyPath(from, to)}/toxics/${SLOW_TOXIC_NAME}`, undefined, [404]);
}

/** Runs `fn` with the link cut and ALWAYS re-opens it afterwards, whatever `fn` does. */
export async function withCut<T>(from: string, to: string, fn: () => Promise<T>): Promise<T> {
  await cut(from, to);
  try {
    return await fn();
  } finally {
    await restore(from, to);
  }
}

/** Runs `fn` with the link slowed and ALWAYS removes the delay afterwards. */
export async function withSlow<T>(
  from: string,
  to: string,
  latencyMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  await slow(from, to, latencyMs);
  try {
    return await fn();
  } finally {
    await clearSlow(from, to);
  }
}

function toxicNames(body: string): string[] {
  const parsed = parseJson(body);
  if (!Array.isArray(parsed)) {
    return [];
  }
  const names: string[] = [];
  for (const toxic of parsed as unknown[]) {
    if (isRecord(toxic) && typeof toxic.name === 'string') {
      names.push(toxic.name);
    }
  }
  return names;
}

/**
 * Defensive reset of EVERY proxy: re-enabled, no toxic left. Meant for the `afterAll` of the fault
 * suites, so that a crashed test never leaves a link cut for the rest of the run.
 */
export async function restoreAll(): Promise<void> {
  const listing = parseJson((await call('GET', '/proxies')).body);
  if (!isRecord(listing)) {
    throw new Error('toxiproxy GET /proxies did not answer an object');
  }
  for (const name of Object.keys(listing)) {
    const path = `/proxies/${encodeURIComponent(name)}`;
    await call('POST', path, { enabled: true });
    for (const toxic of toxicNames((await call('GET', `${path}/toxics`)).body)) {
      await call('DELETE', `${path}/toxics/${encodeURIComponent(toxic)}`, undefined, [404]);
    }
  }
}

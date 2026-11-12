import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { proxyListingFactory, type ToxicFactoryInput } from './network-fault.factory.js';

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly contentType: string | undefined;
  readonly body: string;
}

export interface FakeToxiproxy {
  /** Base URL to put in `TOXIPROXY_URL`. */
  readonly url: string;
  readonly requests: RecordedRequest[];
  /** Makes every later request on `path` answer `status` (to test the error path). */
  failWith(path: string, status: number): void;
  close(): Promise<void>;
}

/**
 * Minimal stand-in for the Toxiproxy HTTP API: lists `proxyNames`, each with `toxics`, records
 * every request and answers 200 (204 on DELETE of a toxic that exists, 404 on one that does not).
 */
export async function startFakeToxiproxy(
  proxyNames: readonly string[],
  toxics: ToxicFactoryInput = {},
): Promise<FakeToxiproxy> {
  const requests: RecordedRequest[] = [];
  const failures = new Map<string, number>();

  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const url = req.url ?? '';
      const method = req.method ?? '';
      requests.push({
        method,
        url,
        contentType: req.headers['content-type'],
        body: Buffer.concat(chunks).toString('utf8'),
      });

      const failure = failures.get(url);
      if (failure !== undefined) {
        res.writeHead(failure).end('forced failure');
        return;
      }
      if (method === 'GET' && url === '/proxies') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(proxyListingFactory(proxyNames)));
        return;
      }
      const toxicsMatch = /^\/proxies\/([^/]+)\/toxics\/([^/]+)$/.exec(url);
      if (method === 'DELETE' && toxicsMatch) {
        const known = (toxics[decodeURIComponent(toxicsMatch[1])] ?? []).includes(
          decodeURIComponent(toxicsMatch[2]),
        );
        res.writeHead(known ? 204 : 404).end();
        return;
      }
      const listMatch = /^\/proxies\/([^/]+)\/toxics$/.exec(url);
      if (method === 'GET' && listMatch) {
        const names = toxics[decodeURIComponent(listMatch[1])] ?? [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(names.map((name) => ({ name }))));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${String(port)}`,
    requests,
    failWith: (path, status) => {
      failures.set(path, status);
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

import type { Server } from 'http';

/**
 * Traefik (v3.6.13 in the cluster, no serversTransport override in deploy) keeps idle backend
 * connections for `forwardingTimeouts.idleConnTimeout`, 90 s by default. Node must close an idle
 * connection after Traefik does, otherwise Traefik reuses a socket Node just closed (502).
 */
const TRAEFIK_IDLE_CONN_TIMEOUT_MS = 90_000;
export const KEEP_ALIVE_TIMEOUT_MS = TRAEFIK_IDLE_CONN_TIMEOUT_MS + 5_000;
/** Must stay above keepAliveTimeout, or Node may drop a reused connection while it waits for headers. */
export const HEADERS_TIMEOUT_MS = KEEP_ALIVE_TIMEOUT_MS + 1_000;

/**
 * The only route reading `request.refreshToken` (via `@UseRefreshToken()`), see
 * `UserAuthController` (`@Controller('users')` + `@Post('refresh')`) and the global prefix.
 */
export const REFRESH_TOKEN_ROUTE = '/api/v1/users/refresh';

interface ExpressSettings {
  set: (key: string, value: unknown) => void;
}

/** Drops the weak ETag Express hashes from every body; the mobile client never sends If-None-Match. */
export function applyHttpTuning(instance: ExpressSettings): void {
  instance.set('etag', false);
}

export function applyServerTimeouts(server: Server): void {
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
}

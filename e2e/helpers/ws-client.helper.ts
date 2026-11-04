import { io, type Socket } from 'socket.io-client';

/** socket.io path exposed by the api-gateway WebSocket proxy (rewritten to /socket.io on ws-service). */
const GATEWAY_SOCKET_PATH = '/api/v1/socket.io';
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_EVENT_TIMEOUT_MS = 20_000;

export interface WaitForSocketEventOptions {
  /** Total time budget before failing. Keep it below the Jest testTimeout. */
  timeoutMs?: number;
  /** Shown in the failure message to say what was awaited. */
  description?: string;
}

function gatewayUrl(): string {
  const url = process.env.E2E_TARGET_URL;
  if (!url) {
    throw new Error('E2E_TARGET_URL is required: the WebSocket client needs a running api-gateway');
  }
  return url;
}

/**
 * Opens a socket.io connection through the api-gateway proxy, authenticated with a real access
 * token (the gateway verifies it and forwards an internal token to ws-service).
 * Resolves once connected, rejects on a refused handshake or after the timeout.
 */
export function connectGatewaySocket(
  accessToken: string,
  timeoutMs: number = DEFAULT_CONNECT_TIMEOUT_MS,
): Promise<Socket> {
  const socket = io(gatewayUrl(), {
    path: GATEWAY_SOCKET_PATH,
    transports: ['websocket'],
    query: { token: accessToken },
    reconnection: false,
    forceNew: true,
  });

  return new Promise<Socket>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(
        new Error(`WebSocket: not connected through the gateway after ${String(timeoutMs)} ms`),
      );
    }, timeoutMs);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('connect_error', (error: Error) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(new Error(`WebSocket: handshake through the gateway refused (${error.message})`));
    });
  });
}

/** Every payload of one socket event received since `recordSocketEvents` was called. */
export interface SocketEventRecorder<T> {
  readonly payloads: readonly T[];
  stop(): void;
}

/**
 * Records every `event` received on `socket` from now on. Use it when the expected ids are only
 * known after the action (attach first, the pipeline may be faster than the HTTP response), or to
 * count notifications; read it with `eventually`, never after a fixed sleep.
 */
export function recordSocketEvents<T>(socket: Socket, event: string): SocketEventRecorder<T> {
  const payloads: T[] = [];
  const onEvent = (payload: T): void => {
    payloads.push(payload);
  };
  socket.on(event, onEvent);
  return {
    payloads,
    stop: () => {
      socket.off(event, onEvent);
    },
  };
}

/**
 * Waits for the first `event` whose payload satisfies `predicate`. Rejects on timeout, or
 * as soon as the server closes the socket (ws-service disconnects an unauthorized client).
 */
export function waitForSocketEvent<T>(
  socket: Socket,
  event: string,
  predicate: (payload: T) => boolean,
  options: WaitForSocketEventOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_EVENT_TIMEOUT_MS;
  const description = options.description ?? `socket event ${event}`;

  return new Promise<T>((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off(event, onEvent);
      socket.off('disconnect', onDisconnect);
    };
    const onEvent = (payload: T): void => {
      if (predicate(payload)) {
        cleanup();
        resolve(payload);
      }
    };
    const onDisconnect = (reason: string): void => {
      cleanup();
      reject(new Error(`WebSocket: "${description}" not received, socket closed (${reason})`));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`WebSocket: "${description}" not received after ${String(timeoutMs)} ms`));
    }, timeoutMs);

    socket.on(event, onEvent);
    socket.on('disconnect', onDisconnect);
  });
}

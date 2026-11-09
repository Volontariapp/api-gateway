import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import * as http from 'http';
import { RefreshTokenMiddleware } from '@volontariapp/auth';
import {
  HEADERS_TIMEOUT_MS,
  KEEP_ALIVE_TIMEOUT_MS,
  REFRESH_TOKEN_ROUTE,
  applyHttpTuning,
  applyServerTimeouts,
} from '../../../common/http-tuning.js';

const TRAEFIK_IDLE_CONN_TIMEOUT_MS = 90_000;

function buildApp(): express.Express {
  const app = express();
  applyHttpTuning(app);
  app.use(REFRESH_TOKEN_ROUTE, new RefreshTokenMiddleware().use);
  const echo = (req: express.Request, res: express.Response) => {
    res.json({
      refreshToken: (req as express.Request & { refreshToken?: string }).refreshToken ?? null,
    });
  };
  app.post(REFRESH_TOKEN_ROUTE, echo);
  app.get('/api/v1/users/me', echo);
  return app;
}

describe('http tuning (Integration)', () => {
  it('does not send an ETag header', async () => {
    const res = await request(buildApp()).get('/api/v1/users/me');
    expect(res.headers['etag']).toBeUndefined();
  });

  it('sets the refresh token on the refresh route as before', async () => {
    const res = await request(buildApp())
      .post(REFRESH_TOKEN_ROUTE)
      .set('Authorization', 'Bearer abc.def.ghi');
    expect(res.body).toEqual({ refreshToken: 'abc.def.ghi' });
  });

  it('does not run the refresh middleware on other routes', async () => {
    const res = await request(buildApp())
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer abc.def.ghi');
    expect(res.body).toEqual({ refreshToken: null });
  });

  it('keeps Node keep-alive above the Traefik idle connection timeout', () => {
    const server = http.createServer();
    applyServerTimeouts(server);
    expect(server.keepAliveTimeout).toBe(KEEP_ALIVE_TIMEOUT_MS);
    expect(server.keepAliveTimeout).toBeGreaterThan(TRAEFIK_IDLE_CONN_TIMEOUT_MS);
    expect(server.headersTimeout).toBe(HEADERS_TIMEOUT_MS);
    expect(server.headersTimeout).toBeGreaterThan(server.keepAliveTimeout);
    server.close();
  });
});

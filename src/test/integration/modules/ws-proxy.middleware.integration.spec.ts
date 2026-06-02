import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { WsProxyMiddleware } from '../../../modules/ws-proxy/ws-proxy.middleware.js';
import type { AuthenticatedWsRequest } from '../../../modules/ws-proxy/ws-proxy.middleware.js';
import { JwtService } from '@volontariapp/auth';
import { AppConfigService } from '../../../config/app-config.service.js';
import { createMock } from '@volontariapp/testing';
import express from 'express';
import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import request from 'supertest';
import * as http from 'http';
import type { AddressInfo } from 'net';
import { setupNestLoggerMock } from '../../helpers/mocks/nest-logger.mock.js';
import { createAuthUserMock } from '../../helpers/factories/auth-user.factory.js';

describe('WsProxyMiddleware (Integration)', () => {
  let middleware: WsProxyMiddleware;
  let jwtServiceMock: jest.Mocked<JwtService>;
  let configServiceMock: jest.Mocked<AppConfigService>;

  let targetApp: express.Express;
  let targetServer: http.Server;
  let proxyApp: express.Express;
  let proxyServer: http.Server;

  let receivedHeaders: Record<string, string | string[] | undefined>;

  beforeEach(async () => {
    setupNestLoggerMock();
    receivedHeaders = {};

    // Setup target server
    targetApp = express();
    targetApp.use((req: Request, res: Response) => {
      receivedHeaders = req.headers;
      res.status(200).send('OK');
    });

    await new Promise<void>((resolve) => {
      targetServer = targetApp.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });

    // Handle pure WebSocket upgrades on the target server
    targetServer.on('upgrade', (req, socket, _head) => {
      receivedHeaders = req.headers;
      socket.write(
        'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
          'Upgrade: WebSocket\r\n' +
          'Connection: Upgrade\r\n' +
          '\r\n',
      );
      socket.pipe(socket);
    });

    const targetAddress = targetServer.address() as AddressInfo;
    const targetUrl = `http://127.0.0.1:${String(targetAddress.port)}`;

    jwtServiceMock = createMock<JwtService>();
    configServiceMock = createMock<AppConfigService>();
    Object.defineProperty(configServiceMock, 'msWsUrl', { value: targetUrl });

    // Create the proxy app
    proxyApp = express();
    proxyApp.use((req: Request, _res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedWsRequest;
      if (req.headers.authorization) {
        authReq.accessToken = req.headers.authorization.split(' ')[1];
      }
      next();
    });

    proxyServer = http.createServer(proxyApp);

    // Mock HttpAdapterHost
    const adapterHostMock = {
      httpAdapter: {
        getHttpServer: () => proxyServer,
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        WsProxyMiddleware,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: AppConfigService, useValue: configServiceMock },
        { provide: HttpAdapterHost, useValue: adapterHostMock },
      ],
    }).compile();

    middleware = module.get<WsProxyMiddleware>(WsProxyMiddleware);

    // Hook the upgrade event manually
    middleware.onModuleInit();

    proxyApp.use((req: Request, res: Response, next: NextFunction) => {
      void middleware.use(req as AuthenticatedWsRequest, res, next);
    });

    const errorHandler: ErrorRequestHandler = (
      err: Error & { status?: number },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      res.status(err.status ?? 500).json({ message: err.message });
    };
    proxyApp.use(errorHandler);

    // Start proxy server
    await new Promise<void>((resolve) => {
      proxyServer.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  afterEach((done) => {
    jest.clearAllMocks();
    proxyServer.close(() => {
      targetServer.close(done);
    });
  });

  describe('HTTP Polling / Normal Proxy', () => {
    it('should verify token, generate internal token, and forward with x-internal-token', async () => {
      const authUserMock = createAuthUserMock({ id: 'user-123', role: 'USER' });
      const spyJwtServiceVerifyAccessToken = jest.spyOn(jwtServiceMock, 'verifyAccessToken');
      const spyJwtServiceSignInternal = jest.spyOn(jwtServiceMock, 'signInternal');
      spyJwtServiceVerifyAccessToken.mockResolvedValue(authUserMock);
      spyJwtServiceSignInternal.mockResolvedValue('internal-signed-token');

      await request(proxyServer)
        .get('/socket.io')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(spyJwtServiceVerifyAccessToken).toHaveBeenCalledWith('valid-access-token');
      expect(spyJwtServiceSignInternal).toHaveBeenCalledWith({ id: 'user-123', role: 'USER' });

      expect(receivedHeaders['x-internal-token']).toBe('internal-signed-token');
    });

    it('should read token from query parameter if header is missing', async () => {
      const authUserMock = createAuthUserMock({ id: 'user-123', role: 'USER' });
      const spyJwtServiceVerifyAccessToken = jest.spyOn(jwtServiceMock, 'verifyAccessToken');
      const spyJwtServiceSignInternal = jest.spyOn(jwtServiceMock, 'signInternal');
      spyJwtServiceVerifyAccessToken.mockResolvedValue(authUserMock);
      spyJwtServiceSignInternal.mockResolvedValue('internal-query-token');

      await request(proxyServer).get('/socket.io?token=query-access-token').expect(200);

      expect(spyJwtServiceVerifyAccessToken).toHaveBeenCalledWith('query-access-token');
      expect(spyJwtServiceSignInternal).toHaveBeenCalledWith({ id: 'user-123', role: 'USER' });

      expect(receivedHeaders['x-internal-token']).toBe('internal-query-token');
    });

    it('should return 401 if token is invalid or missing', async () => {
      const spyJwtServiceVerifyAccessToken = jest.spyOn(jwtServiceMock, 'verifyAccessToken');
      const spyJwtServiceSignInternal = jest.spyOn(jwtServiceMock, 'signInternal');

      await request(proxyServer)
        .get('/socket.io')
        .expect(401)
        .expect((res) => {
          expect((res.body as { message: string }).message).toBe('Missing or invalid access token');
        });

      expect(spyJwtServiceVerifyAccessToken).not.toHaveBeenCalled();
      expect(spyJwtServiceSignInternal).not.toHaveBeenCalled();
    });
  });

  describe('Pure WebSocket Upgrade (Bypass Express Use)', () => {
    it('should intercept native upgrade, verify token, and inject internal token', (done) => {
      const authUserMock = createAuthUserMock({ id: 'user-ws', role: 'USER' });
      const spyJwtServiceVerifyAccessToken = jest.spyOn(jwtServiceMock, 'verifyAccessToken');
      const spyJwtServiceSignInternal = jest.spyOn(jwtServiceMock, 'signInternal');

      spyJwtServiceVerifyAccessToken.mockResolvedValue(authUserMock);
      spyJwtServiceSignInternal.mockResolvedValue('ws-internal-signed-token');

      const proxyAddress = proxyServer.address() as AddressInfo;
      const req = http.request({
        port: proxyAddress.port,
        host: '127.0.0.1',
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
        },
        path: '/socket.io?token=valid-ws-token',
      });

      req.on('upgrade', (res, socket, _upgradeHead) => {
        expect(res.statusCode).toBe(101);
        expect(spyJwtServiceVerifyAccessToken).toHaveBeenCalledWith('valid-ws-token');
        expect(spyJwtServiceSignInternal).toHaveBeenCalledWith({ id: 'user-ws', role: 'USER' });
        expect(receivedHeaders['x-internal-token']).toBe('ws-internal-signed-token');

        socket.end();
        done();
      });

      req.end();
    });
  });
});

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { JwtService, AuthUser } from '@volontariapp/auth';
import { AppConfigService } from '../../config/app-config.service.js';
import type { Options } from 'http-proxy-middleware';
import type { IncomingMessage, ServerResponse, Server } from 'http';
import type { ClientRequest } from 'http';
import type { Socket } from 'net';
import * as url from 'url';

export interface AuthenticatedWsRequest extends Request {
  user?: AuthUser;
  internalWsToken?: string;
  accessToken?: string;
}

@Injectable()
export class WsProxyMiddleware implements NestMiddleware, OnModuleInit {
  private proxy: RequestHandler;
  private readonly logger = new Logger('WS-PROXY-DEBUG');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly adapterHost: HttpAdapterHost,
  ) {
    const rawUrl = this.configService.msWsUrl;
    const wsServiceUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
    this.logger.log(`🚀 Initializing WS Proxy target: ${wsServiceUrl}`);

    const proxyOptions: Options = {
      target: wsServiceUrl,
      changeOrigin: true,
      // Removed ws: true to prevent automatic hooking of the 'upgrade' event by http-proxy-middleware
      pathRewrite: {
        '^/api/v1/socket.io': '/socket.io',
        '^/socket.io': '/socket.io',
      },
      on: {
        proxyReq: (_proxyReq: ClientRequest, req: IncomingMessage, _res: ServerResponse) => {
          this.logger.log(
            `🛰️  [HTTP-PROXY] Outgoing proxy request to microservice: ${req.method ?? 'undefined'} ${req.url ?? 'undefined'}`,
          );
        },
        proxyReqWs: (
          proxyReq: ClientRequest,
          req: IncomingMessage,
          _socket: Socket,
          _options: Options,
          _head: Buffer,
        ) => {
          const customReq = req as AuthenticatedWsRequest;
          if (customReq.headers['x-internal-token']) {
            proxyReq.setHeader('x-internal-token', customReq.headers['x-internal-token']);
          }
          this.logger.log(
            `🔌 [WS-PROXY] Handshake established! Upgrading connection for: ${customReq.url}`,
          );
        },
        open: (_proxySocket: Socket) => {
          this.logger.log(
            '✅ [WS-PROXY] Data channel successfully opened to the backend microservice!',
          );
        },
        close: (_res: IncomingMessage | ServerResponse, _socket: Socket, _head: Buffer) => {
          this.logger.warn('❌ [WS-PROXY] WebSocket connection closed.');
        },
        error: (err: Error, _req: IncomingMessage, _res: ServerResponse | Socket) => {
          this.logger.error(`🚨 [PROXY-ERROR] Critical failure during proxying: ${err.message}`);
          this.logger.error(err.stack);
        },
      },
    };

    this.proxy = createProxyMiddleware(proxyOptions);
  }

  onModuleInit() {
    const server = this.adapterHost.httpAdapter.getHttpServer() as Server | undefined;
    if (!server) {
      this.logger.error('No HTTP server found in adapterHost');
      return;
    }

    server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      void (async () => {
        if (!req.url?.includes('socket.io')) {
          return;
        }

        this.logger.log(`📥 [UPGRADE] Intercepted WebSocket upgrade: ${req.url}`);

        try {
          const parsedUrl = new url.URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
          const token = parsedUrl.searchParams.get('token');

          if (!token) {
            this.logger.warn('🚫 [UPGRADE-FAILED] No token in query string');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }

          const user = await this.jwtService.verifyAccessToken(token);
          this.logger.log(`👤 [UPGRADE-AUTH] Token valid. User ID: ${user.id} (${user.role})`);

          const internalWsToken = await this.jwtService.signInternal({
            id: user.id,
            role: user.role,
          });

          // Mutate headers so proxyReqWs can forward it
          req.headers['x-internal-token'] = internalWsToken;

          // Manually trigger the proxy upgrade
          if (typeof this.proxy.upgrade === 'function') {
            this.proxy.upgrade(req, socket, head);
          } else {
            this.logger.error('Proxy does not support .upgrade()');
            socket.destroy();
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          this.logger.warn(`🛑 [UPGRADE-BLOCKED] Authentication failed: ${message}`);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
        }
      })();
    });
  }

  async use(req: AuthenticatedWsRequest, res: Response, next: NextFunction) {
    this.logger.log(
      `📥 [INCOMING] Intercepted URL: ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`,
    );

    this.logger.debug(
      `[HEADERS-RECEIVED] CF-Access-Client-Id: ${req.headers['cf-access-client-id'] ? '✅ PRESENT' : '❌ MISSING'}`,
    );
    this.logger.debug(
      `[HEADERS-RECEIVED] Authorization: ${req.headers['authorization'] ? '✅ PRESENT' : '❌ MISSING'}`,
    );
    this.logger.debug(`[HEADERS-RECEIVED] Upgrade Header: ${req.headers['upgrade'] ?? 'None'}`);

    if (!req.originalUrl.includes('socket.io')) {
      this.logger.debug(`[BYPASS] Request does not target socket.io. Forwarding to next().`);
      next();
      return;
    }

    try {
      let token = req.accessToken;
      let tokenSource = 'middleware/headers';

      if (!token && req.query['token']) {
        token = req.query['token'] as string;
        tokenSource = 'query';
      }

      this.logger.log(
        `🔑 [AUTH-CHECK] Attempting validation. Token Source detected: ${tokenSource}`,
      );

      if (token) {
        req.user = await this.jwtService.verifyAccessToken(token);
        this.logger.log(
          `👤 [AUTH-SUCCESS] Token valid. User ID: ${req.user.id} (${req.user.role})`,
        );
      }

      if (req.user) {
        req.internalWsToken = await this.jwtService.signInternal({
          id: req.user.id,
          role: req.user.role,
        });

        req.headers['x-internal-token'] = req.internalWsToken;
        this.logger.debug('💉 [HEADERS] Injected x-internal-token into req.headers');
      } else {
        this.logger.warn(
          '🚫 [AUTH-FAILED] Rejecting connection: Missing or invalid token payload.',
        );
        throw new UnauthorizedException('Missing or invalid access token');
      }

      this.logger.log(`🎯 [FORWARDING] Handing off request to createProxyMiddleware...`);

      await this.proxy(req as IncomingMessage, res as unknown as ServerResponse, next);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        this.logger.warn(`🛑 [GUARD-BLOCKED] UnauthorizedException thrown: ${err.message}`);
        res.status(401).json({ message: err.message });
      } else {
        this.logger.error(
          `💥 [CRASH] Unexpected error in WsProxyMiddleware: ${(err as Error).message}`,
        );
        next(err);
      }
    }
  }
}

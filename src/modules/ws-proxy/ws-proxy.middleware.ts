import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtService, AuthUser } from '@volontariapp/auth';
import { AppConfigService } from '../../config/app-config.service.js';
import type { Options } from 'http-proxy-middleware';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ClientRequest } from 'http';
import type { Socket } from 'net';

export interface AuthenticatedWsRequest extends Request {
  user?: AuthUser;
  internalWsToken?: string;
  accessToken?: string;
}

@Injectable()
export class WsProxyMiddleware implements NestMiddleware {
  private proxy: (
    req: IncomingMessage,
    res: ServerResponse,
    next?: (err?: Error) => void,
  ) => void | Promise<void>;
  private readonly logger = new Logger('WS-PROXY-DEBUG');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {
    const rawUrl = this.configService.msWsUrl;
    const wsServiceUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
    this.logger.log(`🚀 Initializing WS Proxy target: ${wsServiceUrl}`);

    const proxyOptions: Options = {
      target: wsServiceUrl,
      changeOrigin: true,
      ws: true,
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
          this.logger.log(
            `🔌 [WS-PROXY] Handshake established! Upgrading connection for: ${req.url ?? 'undefined'}`,
          );
          this.logger.debug(
            `[WS-PROXY] Target Headers sent to MS: ${JSON.stringify(proxyReq.getHeaders())}`,
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

        const separator = req.url.includes('?') ? '&' : '?';
        req.url = `${req.url}${separator}internalToken=${encodeURIComponent(req.internalWsToken)}`;
        this.logger.debug(`💉 [URL-REWRITE] Injected internalToken into req.url: ${req.url}`);
      } else {
        this.logger.warn(
          '🚫 [AUTH-FAILED] Rejecting connection: Missing or invalid token payload.',
        );
        throw new UnauthorizedException('Missing or invalid access token');
      }

      this.logger.log(`🎯 [FORWARDING] Handing off request to createProxyMiddleware...`);

      await this.proxy(req as IncomingMessage, res as ServerResponse, next);
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

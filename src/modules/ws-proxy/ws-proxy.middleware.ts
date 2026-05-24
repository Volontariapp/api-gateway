import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtService, AuthUser } from '@volontariapp/auth';
import { AppConfigService } from '../../config/app-config.service.js';
import type { ClientRequest, IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { RequestHandler } from 'http-proxy-middleware';

export interface AuthenticatedWsRequest extends Request {
  user?: AuthUser;
  internalWsToken?: string;
  accessToken?: string;
}

interface WsIncomingMessage extends IncomingMessage {
  internalWsToken?: string;
}

@Injectable()
export class WsProxyMiddleware implements NestMiddleware {
  private proxy: RequestHandler;
  private readonly logger = new Logger(WsProxyMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {
    const wsServiceUrl = this.configService.msWsUrl;
    this.logger.log(`Initializing WebSocket proxy pointing to: ${wsServiceUrl}`);

    this.proxy = createProxyMiddleware({
      target: wsServiceUrl,
      changeOrigin: true,
      ws: true,
      on: {
        proxyReqWs: (
          proxyReq: ClientRequest,
          req: IncomingMessage,
          _socket: Socket,
          _options: unknown,
          _head: unknown,
        ) => {
          const authReq = req as WsIncomingMessage;
          if (authReq.internalWsToken) {
            proxyReq.setHeader('x-internal-token', authReq.internalWsToken);
            this.logger.debug('Added x-internal-token to WebSocket upgrade request');
          }
        },
        proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
          const authReq = req as WsIncomingMessage;
          if (authReq.internalWsToken) {
            proxyReq.setHeader('x-internal-token', authReq.internalWsToken);
            this.logger.debug('Added x-internal-token to HTTP proxy request');
          }
        },
      },
    });
  }

  async use(req: AuthenticatedWsRequest, res: Response, next: NextFunction) {
    try {
      this.logger.debug(`Incoming WebSocket request to: ${req.originalUrl}`);
      let token = req.accessToken;
      let tokenSource = 'middleware/headers';

      if (!token && req.query['token']) {
        token = req.query['token'] as string;
        tokenSource = 'query';
      }

      if (token) {
        this.logger.debug(`Verifying access token from ${tokenSource}`);
        req.user = await this.jwtService.verifyAccessToken(token);
        this.logger.debug(`Token verified for user ID: ${req.user.id}`);
      }

      if (req.user) {
        req.internalWsToken = await this.jwtService.signInternal({
          id: req.user.id,
          role: req.user.role,
        });
        this.logger.debug('Generated internal WebSocket token');
      } else {
        this.logger.warn('Connection rejected: Missing or invalid access token');
        throw new UnauthorizedException('Missing or invalid access token');
      }

      // Call the proxy
      await Promise.resolve(this.proxy(req, res, next));
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        // Log is already produced
      } else {
        this.logger.error(
          `Error in WebSocket proxy middleware: ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
      next(err);
    }
  }
}

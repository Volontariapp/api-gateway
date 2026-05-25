import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtService, AuthUser } from '@volontariapp/auth';
import { AppConfigService } from '../../config/app-config.service.js';
import type { RequestHandler } from 'http-proxy-middleware';

export interface AuthenticatedWsRequest extends Request {
  user?: AuthUser;
  internalWsToken?: string;
  accessToken?: string;
}

@Injectable()
export class WsProxyMiddleware implements NestMiddleware {
  private proxy: RequestHandler;
  private readonly logger = new Logger(WsProxyMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {
    const rawUrl = this.configService.msWsUrl;
    const wsServiceUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
    this.logger.log(`Initializing WebSocket proxy pointing to: ${wsServiceUrl}`);

    this.proxy = createProxyMiddleware({
      target: wsServiceUrl,
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => path.replace(/^\/api\/v1/, ''),
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

        const separator = req.url.includes('?') ? '&' : '?';
        req.url = `${req.url}${separator}internalToken=${encodeURIComponent(req.internalWsToken)}`;
        this.logger.debug('Injected internalToken into proxied URL');
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

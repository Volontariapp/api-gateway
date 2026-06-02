import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { WsProxyMiddleware } from './ws-proxy.middleware.js';
import { AuthModule } from '@volontariapp/auth';

@Module({
  imports: [AuthModule],
  providers: [WsProxyMiddleware],
})
export class WsProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WsProxyMiddleware)
      .forRoutes(
        { path: 'api/v1/socket.io', method: RequestMethod.ALL },
        { path: 'api/v1/socket.io/*path', method: RequestMethod.ALL },
      );
  }
}

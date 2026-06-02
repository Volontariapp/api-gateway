import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { WsProxyMiddleware } from './ws-proxy.middleware.js';
import { AuthModule } from '@volontariapp/auth';

@Module({
  imports: [AuthModule],
  providers: [WsProxyMiddleware],
  exports: [WsProxyMiddleware],
})
export class WsProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WsProxyMiddleware)
      .forRoutes(
        { path: 'socket.io', method: RequestMethod.ALL },
        { path: 'socket.io/*', method: RequestMethod.ALL },
      );
  }
}

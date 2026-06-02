import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WsProxyMiddleware } from './ws-proxy.middleware.js';
import { AuthModule } from '@volontariapp/auth';

@Module({
  imports: [AuthModule],
  providers: [WsProxyMiddleware],
})
export class WsProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WsProxyMiddleware).forRoutes('*');
  }
}

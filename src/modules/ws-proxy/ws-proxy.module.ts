import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WsProxyMiddleware } from './ws-proxy.middleware.js';
import { AuthModule } from '@volontariapp/auth';
import { WsProxyController } from './ws-proxy.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [WsProxyController],
  providers: [WsProxyMiddleware],
})
export class WsProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WsProxyMiddleware).forRoutes('*');
  }
}

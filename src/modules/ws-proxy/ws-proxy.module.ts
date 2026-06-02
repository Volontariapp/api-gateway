import { Module } from '@nestjs/common';
import { WsProxyMiddleware } from './ws-proxy.middleware.js';
import { AuthModule } from '@volontariapp/auth';

@Module({
  imports: [AuthModule],
  providers: [WsProxyMiddleware],
  exports: [WsProxyMiddleware],
})
export class WsProxyModule {}

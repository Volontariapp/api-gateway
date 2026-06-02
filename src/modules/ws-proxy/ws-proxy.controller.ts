import { Controller, All } from '@nestjs/common';

@Controller('socket.io')
export class WsProxyController {
  @All('*')
  catchAll() {
    // The WsProxyMiddleware should intercept the request and not call next().
    // If the request reaches here, it means it bypassed the proxy.
    return { status: 'proxy bypassed or failed' };
  }

  @All()
  catchRoot() {
    return { status: 'proxy bypassed or failed' };
  }
}

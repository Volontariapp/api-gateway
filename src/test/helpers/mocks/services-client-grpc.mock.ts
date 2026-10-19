import type { ClientGrpc } from '@nestjs/microservices';

/** gRPC client that hands out the given service mock by service name. */
export class MockServicesClientGrpc implements ClientGrpc {
  constructor(private readonly services: Readonly<Partial<Record<string, object>>>) {}

  getService<T>(name: string): T {
    const service = this.services[name];
    if (service === undefined) {
      throw new Error(`No mock registered for gRPC service ${name}`);
    }
    return service as T;
  }

  getClientByServiceName<T>(name: string): T {
    return this.getService<T>(name);
  }
}

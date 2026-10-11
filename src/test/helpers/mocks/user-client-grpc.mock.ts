import type { ClientGrpc } from '@nestjs/microservices';
import type { UserServiceClient } from '@volontariapp/contracts-nest';

export class MockUserClientGrpc implements ClientGrpc {
  constructor(private readonly userService: UserServiceClient) {}

  getService<T>(_name: string): T {
    return this.userService as T;
  }

  getClientByServiceName<T>(_name: string): T {
    return this.userService as T;
  }
}

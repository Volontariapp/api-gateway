import type { ClientGrpc } from '@nestjs/microservices';
import type { BadgeServiceClient } from '@volontariapp/contracts-nest';

export class MockBadgeClientGrpc implements ClientGrpc {
  constructor(private readonly badgeService: BadgeServiceClient) {}

  getService<T>(_name: string): T {
    return this.badgeService as T;
  }

  getClientByServiceName<T>(_name: string): T {
    return this.badgeService as T;
  }
}

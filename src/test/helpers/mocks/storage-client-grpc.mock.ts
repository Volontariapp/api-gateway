import type { ClientGrpc } from '@nestjs/microservices';
import type { StorageServiceClient } from '@volontariapp/contracts-nest';

export class MockStorageClientGrpc implements ClientGrpc {
  constructor(private readonly storageService: StorageServiceClient) {}

  getService<T>(_name: string): T {
    return this.storageService as T;
  }

  getClientByServiceName<T>(_name: string): T {
    return this.storageService as T;
  }
}

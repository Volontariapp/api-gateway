import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { STORAGE_SERVICE_NAME, StorageServiceClient } from '@volontariapp/contracts-nest';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { STORAGE_PACKAGE } from '../../../grpc/grpc-packages.js';

export abstract class BaseStorageGrpcController implements OnModuleInit {
  protected storageService!: WithMetadata<StorageServiceClient>;

  constructor(@Inject(STORAGE_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.storageService = this.client.getService<StorageServiceClient>(STORAGE_SERVICE_NAME);
  }
}

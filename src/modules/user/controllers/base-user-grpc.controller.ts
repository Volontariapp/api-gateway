import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import { USER_SERVICE_NAME, UserServiceClient } from '@volontariapp/contracts-nest';

export abstract class BaseUserGrpcController implements OnModuleInit {
  protected userService!: WithMetadata<UserServiceClient>;

  constructor(@Inject(USER_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }
}

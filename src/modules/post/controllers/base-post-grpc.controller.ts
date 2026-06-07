import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { POST_PACKAGE } from '../../../grpc/grpc-packages.js';
import { POST_SERVICE_NAME, PostServiceClient } from '@volontariapp/contracts-nest';

export abstract class BasePostGrpcController implements OnModuleInit {
  protected postService!: WithMetadata<PostServiceClient>;

  constructor(@Inject(POST_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.postService = this.client.getService<PostServiceClient>(POST_SERVICE_NAME);
  }
}

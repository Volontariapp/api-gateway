import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import { BADGE_SERVICE_NAME, BadgeServiceClient } from '@volontariapp/contracts-nest';

export abstract class BaseBadgeGrpcController implements OnModuleInit {
  protected badgeService!: WithMetadata<BadgeServiceClient>;

  constructor(@Inject(USER_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.badgeService = this.client.getService<BadgeServiceClient>(BADGE_SERVICE_NAME);
  }
}

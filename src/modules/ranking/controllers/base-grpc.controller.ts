import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  RANKING_COMMAND_SERVICE_NAME,
  RankingCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { RANKING_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';

export abstract class BaseRankingCommandGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<RankingCommandServiceClient>;

  constructor(@Inject(RANKING_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<RankingCommandServiceClient>(
      RANKING_COMMAND_SERVICE_NAME,
    );
  }
}

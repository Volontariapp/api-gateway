import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  RANKING_QUERY_SERVICE_NAME,
  RankingQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { RANKING_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';

export abstract class BaseRankingQueryGrpcController implements OnModuleInit {
  protected queryService!: WithMetadata<RankingQueryServiceClient>;

  constructor(@Inject(RANKING_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.queryService = this.client.getService<RankingQueryServiceClient>(
      RANKING_QUERY_SERVICE_NAME,
    );
  }
}

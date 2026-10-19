import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import {
  RELATIONSHIP_QUERY_SERVICE_NAME,
  RelationshipQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { RANKING_BLOCKS_PAGE_LIMIT } from '../constants/ranking.constants.js';

/**
 * Users hidden from the reader: the ones they blocked and the ones who blocked them. Read at each
 * request so a block applies without waiting for the next recompute (up to about 2 h for the feed).
 * An error is not swallowed: serving a feed that may show a blocked author is worse than failing.
 */
@Injectable()
export class RankingBlocksService implements OnModuleInit {
  private relationshipQueryService!: WithMetadata<RelationshipQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc) {}

  onModuleInit() {
    this.relationshipQueryService = this.socialClient.getService<RelationshipQueryServiceClient>(
      RELATIONSHIP_QUERY_SERVICE_NAME,
    );
  }

  async hiddenUserIds(metadata: Metadata): Promise<Set<string>> {
    const pagination = { page: 1, limit: RANKING_BLOCKS_PAGE_LIMIT };
    const [myBlocks, whoBlockedMe] = await Promise.all([
      firstValueFrom(this.relationshipQueryService.getMyBlocks({ pagination }, metadata)),
      firstValueFrom(this.relationshipQueryService.getWhoBlockedMe({ pagination }, metadata)),
    ]);
    return new Set([...myBlocks.ids, ...whoBlockedMe.ids]);
  }
}

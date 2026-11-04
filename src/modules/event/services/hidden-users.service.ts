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
import { fetchAllPages } from '../../../common/pagination/index.js';

/**
 * Users hidden from the reader: the ones they blocked and the ones who blocked them. Read at each
 * request so a block applies without waiting for the next recompute (up to about 2 h for the feed).
 * An error is not swallowed: serving a feed that may show a blocked author is worse than failing.
 */
@Injectable()
export class HiddenUsersService implements OnModuleInit {
  private relationshipQueryService!: WithMetadata<RelationshipQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc) {}

  onModuleInit() {
    this.relationshipQueryService = this.socialClient.getService<RelationshipQueryServiceClient>(
      RELATIONSHIP_QUERY_SERVICE_NAME,
    );
  }

  async hiddenUserIds(metadata: Metadata): Promise<Set<string>> {
    const [myBlocks, whoBlockedMe] = await Promise.all([
      fetchAllPages((pagination) =>
        firstValueFrom(this.relationshipQueryService.getMyBlocks({ pagination }, metadata)),
      ),
      fetchAllPages((pagination) =>
        firstValueFrom(this.relationshipQueryService.getWhoBlockedMe({ pagination }, metadata)),
      ),
    ]);
    return new Set([...myBlocks, ...whoBlockedMe]);
  }
}

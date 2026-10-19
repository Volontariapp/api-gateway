import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  POST_SERVICE_NAME,
  PostServiceClient,
  RANKING_QUERY_SERVICE_NAME,
  RankingQueryServiceClient,
  type GetRankingFeedQuery,
} from '@volontariapp/contracts-nest';
import { POST_PACKAGE, RANKING_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { PublicFileUrlService } from '../../storage/public-file-url.service.js';
import { PostDTO } from '../../post/dto/common/post.dto.js';
import { EMPTY_RANKING_PAGE } from '../constants/ranking.constants.js';
import { orderByRanking } from '../helpers/ranking-order.helper.js';
import { RankedPostDTO } from '../dto/common/ranked-post.dto.js';
import { GetRankingFeedResponseDTO } from '../dto/response/get-ranking-feed.response.dto.js';
import type { RankingPageOnWire } from '../types/ranking-wire.type.js';
import { RankingBlocksService } from './ranking-blocks.service.js';

/**
 * GET /ranking/feed: the order comes from ms-ranking, the content from ms-post.ListPostsByIds, and
 * the blocks of the reader are applied at read time.
 */
@Injectable()
export class RankedFeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: RankedFeedService.name });
  private rankingQueryService!: WithMetadata<RankingQueryServiceClient>;
  private postService!: WithMetadata<PostServiceClient>;

  constructor(
    @Inject(RANKING_PACKAGE) private readonly rankingClient: ClientGrpc,
    @Inject(POST_PACKAGE) private readonly postClient: ClientGrpc,
    private readonly publicFileUrls: PublicFileUrlService,
    private readonly blocks: RankingBlocksService,
  ) {}

  onModuleInit() {
    this.rankingQueryService = this.rankingClient.getService<RankingQueryServiceClient>(
      RANKING_QUERY_SERVICE_NAME,
    );
    this.postService = this.postClient.getService<PostServiceClient>(POST_SERVICE_NAME);
  }

  async read(query: GetRankingFeedQuery, metadata: Metadata): Promise<GetRankingFeedResponseDTO> {
    const response = await firstValueFrom(this.rankingQueryService.getRankingFeed(query, metadata));
    const page: RankingPageOnWire = response.page ?? EMPTY_RANKING_PAGE;
    if (page.items.length === 0) {
      return GetRankingFeedResponseDTO.fromPage([], 0, page);
    }

    const ids = page.items.map((item) => item.id);
    const [content, hidden] = await Promise.all([
      firstValueFrom(this.postService.listPostsByIds({ ids }, metadata)),
      this.blocks.hiddenUserIds(metadata),
    ]);

    const ranked = orderByRanking(page.items, content.posts)
      .filter(({ content: post }) => !hidden.has(post.authorId))
      .map(({ content: post, item }) =>
        RankedPostDTO.fromRankedPost(PostDTO.fromPost(post, this.publicFileUrls), item),
      );

    this.logger.log(
      `Ranked feed page: ${String(page.items.length)} ranked, ${String(ranked.length)} served`,
    );
    return GetRankingFeedResponseDTO.fromPage(ranked, page.totalCount, page);
  }
}

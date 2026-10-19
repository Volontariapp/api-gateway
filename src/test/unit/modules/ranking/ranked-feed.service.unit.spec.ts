import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import {
  POST_SERVICE_NAME,
  RANKING_QUERY_SERVICE_NAME,
  RELATIONSHIP_QUERY_SERVICE_NAME,
  RankingReason,
  type PostServiceClient,
  type RankingQueryServiceClient,
  type RelationshipQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { GrpcStatus } from '@volontariapp/errors';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { RankedFeedService } from '../../../../modules/ranking/services/ranked-feed.service.js';
import { RankingBlocksService } from '../../../../modules/ranking/services/ranking-blocks.service.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { PostFactory } from '../../../helpers/factories/post.factory.js';
import { RankingFactory } from '../../../helpers/factories/ranking.factory.js';
import {
  BLOCKED_AUTHOR_ID,
  RANKED_EVENT_ID_1 as POST_ID_1,
  RANKED_EVENT_ID_2 as POST_ID_2,
  RANKED_EVENT_ID_3 as POST_ID_3,
  WHO_BLOCKED_ME_ID,
} from '../../../helpers/constants/ranking-test.constants.js';

const FRIEND_ID = '11111111-1f5e-4a51-9f3a-1a2b3c4d5e11';
const PAGINATION = { total: 1, page: 1, limit: 1000, totalPages: 1 };

describe('RankedFeedService (Unit)', () => {
  let rankingQuery: jest.Mocked<WithMetadata<RankingQueryServiceClient>>;
  let postService: jest.Mocked<WithMetadata<PostServiceClient>>;
  let relationshipQuery: jest.Mocked<WithMetadata<RelationshipQueryServiceClient>>;
  let service: RankedFeedService;
  const metadata = new Metadata();

  beforeEach(() => {
    rankingQuery = createMock<WithMetadata<RankingQueryServiceClient>>();
    postService = createMock<WithMetadata<PostServiceClient>>();
    relationshipQuery = createMock<WithMetadata<RelationshipQueryServiceClient>>();
    const blocks = new RankingBlocksService(
      new MockServicesClientGrpc({ [RELATIONSHIP_QUERY_SERVICE_NAME]: relationshipQuery }),
    );
    blocks.onModuleInit();
    service = new RankedFeedService(
      new MockServicesClientGrpc({ [RANKING_QUERY_SERVICE_NAME]: rankingQuery }),
      new MockServicesClientGrpc({ [POST_SERVICE_NAME]: postService }),
      PublicFileUrlFactory.createService(),
      blocks,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const rankThreePosts = () => {
    const page = RankingFactory.createPage([
      RankingFactory.createItem({ id: POST_ID_3, rank: 1, score: 0.7 }),
      RankingFactory.createItem({ id: POST_ID_1, rank: 2 }),
      RankingFactory.createItem({
        id: POST_ID_2,
        rank: 3,
        reasons: [RankingReason.RANKING_REASON_FOLLOWED_AUTHOR],
      }),
    ]);
    jest.spyOn(rankingQuery, 'getRankingFeed').mockReturnValue(of({ page }));
    return jest.spyOn(postService, 'listPostsByIds').mockReturnValue(
      of({
        posts: [
          PostFactory.createPost({ id: POST_ID_1, authorId: BLOCKED_AUTHOR_ID }),
          PostFactory.createPost({ id: POST_ID_2, authorId: FRIEND_ID }),
          PostFactory.createPost({ id: POST_ID_3, authorId: WHO_BLOCKED_ME_ID }),
        ],
      }),
    );
  };

  it('should hide the authors blocked either way without a recompute', async () => {
    const listSpy = rankThreePosts();
    const myBlocksSpy = jest
      .spyOn(relationshipQuery, 'getMyBlocks')
      .mockReturnValue(of({ ids: [BLOCKED_AUTHOR_ID], pagination: PAGINATION }));
    jest
      .spyOn(relationshipQuery, 'getWhoBlockedMe')
      .mockReturnValue(of({ ids: [WHO_BLOCKED_ME_ID], pagination: PAGINATION }));

    const result = await service.read({ cursor: '', limit: 20 }, metadata);

    expect(result.posts.map((p) => p.id)).toEqual([POST_ID_2]);
    expect(result.posts[0]?.reasons).toEqual(['FOLLOWED_AUTHOR']);
    expect(listSpy).toHaveBeenCalledWith({ ids: [POST_ID_3, POST_ID_1, POST_ID_2] }, metadata);
    expect(myBlocksSpy).toHaveBeenCalledWith({ pagination: { page: 1, limit: 1000 } }, metadata);
  });

  it('should keep the ranking order when nobody is blocked', async () => {
    rankThreePosts();
    jest
      .spyOn(relationshipQuery, 'getMyBlocks')
      .mockReturnValue(of({ ids: [], pagination: PAGINATION }));
    jest
      .spyOn(relationshipQuery, 'getWhoBlockedMe')
      .mockReturnValue(of({ ids: [], pagination: PAGINATION }));

    const result = await service.read({ cursor: '', limit: 20 }, metadata);

    expect(result.posts.map((p) => p.id)).toEqual([POST_ID_3, POST_ID_1, POST_ID_2]);
    expect(result.posts[0]?.rankingScore).toBe(0.7);
  });

  it('should fail rather than serve a feed when the blocks cannot be read', async () => {
    rankThreePosts();
    jest
      .spyOn(relationshipQuery, 'getMyBlocks')
      .mockReturnValue(throwError(() => ({ code: GrpcStatus.UNAVAILABLE })));
    jest
      .spyOn(relationshipQuery, 'getWhoBlockedMe')
      .mockReturnValue(of({ ids: [], pagination: PAGINATION }));

    await expect(service.read({ cursor: '', limit: 20 }, metadata)).rejects.toEqual({
      code: GrpcStatus.UNAVAILABLE,
    });
  });

  it('should answer an empty page without calling ms-post nor ms-social', async () => {
    jest
      .spyOn(rankingQuery, 'getRankingFeed')
      .mockReturnValue(of({ page: RankingFactory.createPage([], { hasMore: false }) }));
    const listSpy = jest.spyOn(postService, 'listPostsByIds');
    const blocksSpy = jest.spyOn(relationshipQuery, 'getMyBlocks');

    const result = await service.read({ cursor: '', limit: 20 }, metadata);

    expect(result).toMatchObject({ posts: [], totalCount: 0 });
    expect(listSpy).not.toHaveBeenCalled();
    expect(blocksSpy).not.toHaveBeenCalled();
  });
});

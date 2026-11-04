import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GetRankingFeedWebResponse } from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { eventually } from '../helpers/eventually.helper.js';
import { waitForSocialUserNode } from '../helpers/social-node.helper.js';
import { createPost } from '../post/post-test.helpers.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';

const FEED_PATH = '/api/v1/ranking/feed?limit=50';
/** A compute job goes through outbox-ranking, BullMQ and worker-ranking (gRPC to ms-post/ms-social). */
const RANKING_TIMEOUT_MS = 30_000;
/** Two sign-ups and two list computations: above the default testTimeout of 60 s at worst. */
const FAN_OUT_TEST_TIMEOUT_MS = 120_000;

interface FeedRead {
  status: number;
  body: GetRankingFeedWebResponse;
}

/**
 * Async pipeline: ranking feed
 *   Cold start: GET /ranking/feed without a list -> ms-ranking writes an ON_DEMAND job in
 *   jobs_outbox (ms_ranking) and answers 206 -> outbox-ranking pushes it to BullMQ
 *   -> worker-ranking computes the list -> the next GET answers 200.
 *   Fan-out: POST /posts -> ms-post -> outbox-post (stream post:created) -> post-processor-ranking
 *   writes a FANOUT_RANKING job -> outbox-ranking -> worker-ranking requests a compute for every
 *   active follower of the author -> worker-ranking recomputes the follower feed.
 * A GET on an existing, fresh list never writes a job: once the follower list exists, only the
 * fan-out can bring the new post into it.
 * Runs only when the compose starts the ranking stack (E2E_RANKING_ENABLED=true, set by ci-tools
 * on api-gateway-e2e), like the ms-ranking scenarios of ranking.e2e.spec.ts.
 */
const describeWithRanking = process.env.E2E_RANKING_ENABLED === 'true' ? describe : describe.skip;

describeWithRanking('Async pipeline: ranking feed (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  const createdUserIds: string[] = [];

  const createUser = async (): Promise<{ id: string; client: TestClient }> => {
    const res = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
    const id = (res.body as SignUpResponseDTO).user.id;
    createdUserIds.push(id);
    await waitForSocialUserNode(admin, id);
    const client = await createTestClient(app).login({ id, role: UserRoles.VOLUNTEER });
    return { id, client };
  };

  const readFeed = async (client: TestClient): Promise<FeedRead> => {
    const res = await client.get(FEED_PATH);
    return { status: res.status, body: res.body as GetRankingFeedWebResponse };
  };

  const waitForComputedFeed = (client: TestClient, description: string): Promise<FeedRead> =>
    eventually(
      () => readFeed(client),
      (read) => read.status === 200,
      { timeoutMs: RANKING_TIMEOUT_MS, description },
    );

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.delete(`/api/v1/users/${id}`)));
    await app.close();
  });

  it('computes the feed of a cold start in the background', async () => {
    const reader = await createUser();

    const computed = await waitForComputedFeed(reader.client, `feed list of user ${reader.id}`);

    expect(computed.body.ranking.computedAt).toBeTruthy();
    expect(Array.isArray(computed.body.posts)).toBe(true);
  });

  it(
    'brings a new post of a followed author into the feed of its follower',
    async () => {
      const follower = await createUser();
      await waitForComputedFeed(follower.client, `first feed list of follower ${follower.id}`);

      const author = await createUser();
      await follower.client.post(`/api/v1/social/follow/${author.id}`).expect(201);
      const { postId } = await createPost(author.client);

      try {
        const updated = await eventually(
          () => readFeed(follower.client),
          (read) => read.status === 200 && read.body.posts.some((post) => post.id === postId),
          {
            timeoutMs: RANKING_TIMEOUT_MS,
            description: `post ${postId} in the feed of follower ${follower.id} (post.created fan-out)`,
          },
        );
        expect(updated.body.posts.map((post) => post.id)).toContain(postId);
      } finally {
        await author.client.delete(`/api/v1/posts/${postId}`);
      }
    },
    FAN_OUT_TEST_TIMEOUT_MS,
  );
});

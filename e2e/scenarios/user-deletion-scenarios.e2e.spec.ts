import type { Socket } from 'socket.io-client';
import type {
  GetPostsLikeSummaryResponse,
  IdsListWebResponse,
  ListCommentsWebResponse,
  ListPostsWebResponse,
} from '@volontariapp/contracts';
import { DELETED_USER_ID } from '@volontariapp/shared';
import { eventually } from '../helpers/eventually.helper.js';
import type { SocketEventRecorder } from '../helpers/ws-client.helper.js';
import { recordSocketEvents } from '../helpers/ws-client.helper.js';
import { waitForSocialUserNode } from '../helpers/social-node.helper.js';
import { createSuiteGeo } from '../event/event-search.helper.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import {
  readSocialIds,
  waitForSocialIdsToExclude,
  waitForSocialUserNodeRemoved,
} from './helpers/social-graph.helper.js';
import {
  FILE_STATUS_DELETED,
  FILE_STATUS_ORPHANED,
  fileStatusName,
  readFile,
  readPublicObjectStatus,
} from './helpers/storage-upload.helper.js';
import type { DeletionFixture } from './helpers/user-deletion-fixture.helper.js';
import {
  buildDeletionFixture,
  readRankingFeed,
  searchEventIds,
} from './helpers/user-deletion-fixture.helper.js';
import { WS_EVENTS } from './helpers/ws-events.js';

/** Payload of 'user.deleted' (IUserDeletedWebsocketPayload of @volontariapp/messaging). */
interface UserDeletedWsPayload {
  id: string;
  role: string;
  isEmitter: boolean;
}

interface EventIdsBody {
  events: { id: string }[];
}

/** Uploads, three events, four posts, ranking and attachments chained: far above the default. */
const SETUP_TIMEOUT_MS = 240_000;
/** The first assertion absorbs the whole saga (6 purges, gather, outbox-ws, finalizeDeletion). */
const SAGA_TEST_TIMEOUT_MS = 150_000;
const SAGA_WAIT_MS = 90_000;
const TEST_TIMEOUT_MS = 120_000;

/** DELETED_COMMENT_PLACEHOLDER of @volontariapp/domain-post (constants/post.constants.ts). */
const DELETED_COMMENT_PLACEHOLDER = 'Commentaire supprimé';

/** The ranking stack is only started when ci-tools sets E2E_RANKING_ENABLED (see async/ranking-feed). */
const itWithRanking = process.env.E2E_RANKING_ENABLED === 'true' ? it : it.skip;

/**
 * Account deletion saga, end to end (catalogue: e2e/scenarios/README.md).
 *   DELETE /users/me -> ms-user (PENDING_DELETION + user.deleted in one transaction) -> outbox-user
 *   -> 6 streams. Each domain purges, then acknowledges to the ws-service USER_DELETION gather
 *   (USER_SOCIAL_DELETED, USER_POST_DELETED, USER_EVENT_DELETED, USER_STORAGE_DELETED,
 *   USER_RANKING_DELETED). On success ws-service notifies the socket of the deleted user and writes
 *   user.deletion_successfull -> outbox-ws -> post-processor-user finalizeDeletion (physical delete).
 * One rich world is built once, the account is deleted once, then one test per domain reads it.
 */
describe('Scenarios: account deletion saga (E2E)', () => {
  let world: ScenarioWorld;
  let fx: DeletionFixture;
  let socket: Socket;
  let deleted: SocketEventRecorder<UserDeletedWsPayload>;
  let failed: SocketEventRecorder<UserDeletedWsPayload>;
  let duplicateSignUpStatusWhilePending: number;
  const geo = createSuiteGeo();

  beforeAll(async () => {
    world = await ScenarioWorld.open();
    fx = await buildDeletionFixture(world, geo, {
      rankingEnabled: process.env.E2E_RANKING_ENABLED === 'true',
    });

    // The socket is connected and recording BEFORE the deletion: the pipeline may be faster than
    // the HTTP response.
    socket = await world.connect(fx.leaving);
    deleted = recordSocketEvents<UserDeletedWsPayload>(socket, WS_EVENTS.USER_DELETED);
    failed = recordSocketEvents<UserDeletedWsPayload>(socket, WS_EVENTS.USER_DELETION_FAILED);

    world.forgetUser(fx.leaving.id);
    await fx.leaving.client.delete('/api/v1/users/me').expect(200);

    // Same e-mail while the account is PENDING_DELETION: the users row still exists (unique column).
    const duplicate = await world.admin
      .post('/api/v1/users')
      .send(signUpRequestFactory({ email: fx.leaving.email }));
    duplicateSignUpStatusWhilePending = duplicate.status;
    if (duplicate.status === 201) {
      world.trackUser((duplicate.body as SignUpResponseDTO).user.id);
    }
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    deleted.stop();
    failed.stop();
    await world.close();
  });

  /** Polls a social route until it answers 404 (node gone) or an empty ids list. */
  const waitForNoLinks = (client: TestClient, path: string, description: string) =>
    eventually(
      async () => {
        const res = await client.get(path);
        return {
          status: res.status,
          ids: res.status === 200 ? (res.body as IdsListWebResponse).ids : [],
        };
      },
      (read) => read.status !== 200 || read.ids.length === 0,
      { timeoutMs: SAGA_WAIT_MS, description },
    );

  /** Polls an existence route of ms-social until `exists` is false (or the route answers 404). */
  const waitForNodeGone = (path: string, description: string) =>
    eventually(
      async () => {
        const res = await world.admin.get(path);
        return res.status !== 200 || !(res.body as { exists: boolean }).exists;
      },
      (gone) => gone,
      { timeoutMs: SAGA_WAIT_MS, description },
    );

  const waitForStatus = (client: TestClient, path: string, expected: number, description: string) =>
    eventually(
      async () => (await client.get(path)).status,
      (status) => status === expected,
      { timeoutMs: SAGA_WAIT_MS, description },
    );

  it(
    "gather: the deleted user's own socket receives 'user.deleted' once the domains acknowledged",
    async () => {
      const received = await eventually(
        () => Promise.resolve(deleted.payloads.filter((payload) => payload.id === fx.leaving.id)),
        (payloads) => payloads.length > 0,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `'user.deleted' for the socket of ${fx.leaving.id} (USER_DELETION gather)`,
        },
      );

      expect(received).toHaveLength(1);
      expect(received[0].isEmitter).toBe(true);
      // The gather succeeded: no domain reported a failed purge.
      expect(failed.payloads).toHaveLength(0);
    },
    SAGA_TEST_TIMEOUT_MS,
  );

  it(
    'user: the account is hidden at once, then the users row is deleted and the e-mail is free',
    async () => {
      await world.admin.get(`/api/v1/users/${fx.leaving.id}`).expect(404);
      await world.admin
        .post('/api/v1/users/login')
        .send({ email: fx.leaving.email, password: fx.leaving.password })
        .expect(404);
      // Unique e-mail still held by the PENDING_DELETION row when the account was just requested.
      expect(duplicateSignUpStatusWhilePending).toBe(409);

      // user.deletion_successfull -> outbox-ws -> post-processor-user finalizeDeletion.
      const reused = await eventually(
        async () => {
          const res = await world.admin
            .post('/api/v1/users')
            .send(signUpRequestFactory({ email: fx.leaving.email }));
          return { status: res.status, body: res.body as SignUpResponseDTO };
        },
        (read) => read.status === 201,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `sign-up with the e-mail of the deleted user ${fx.leaving.id} (row deleted)`,
        },
      );
      const reusedId = reused.body.user.id;
      world.trackUser(reusedId);
      expect(reusedId).not.toBe(fx.leaving.id);
      await waitForSocialUserNode(world.admin, reusedId);

      // The user was notified exactly once, whatever happened afterwards.
      expect(deleted.payloads.filter((payload) => payload.id === fx.leaving.id)).toHaveLength(1);
    },
    SAGA_TEST_TIMEOUT_MS,
  );

  it(
    'social: the node and every relation of the user are gone, the other relations are intact',
    async () => {
      const { leaving, friend, organizer, blocked, bystander } = fx;
      await waitForSocialUserNodeRemoved(world.admin, leaving.id);

      await waitForSocialIdsToExclude(
        world.admin,
        `/api/v1/social/users/${friend.id}/follows`,
        leaving.id,
        `FOLLOWS link from friend ${friend.id} to the deleted user`,
      );
      await waitForSocialIdsToExclude(
        world.admin,
        `/api/v1/social/users/${friend.id}/followers`,
        leaving.id,
        `FOLLOWS link from the deleted user to friend ${friend.id}`,
      );
      await waitForSocialIdsToExclude(
        world.admin,
        `/api/v1/social/users/${organizer.id}/followers`,
        leaving.id,
        `FOLLOWS link from the deleted user to organizer ${organizer.id}`,
      );
      await waitForSocialIdsToExclude(
        blocked.client,
        '/api/v1/social/who-blocked-me',
        leaving.id,
        `BLOCKS link from the deleted user to ${blocked.id}`,
      );

      // Interactions on the content of others: participation, wish, like.
      await waitForSocialIdsToExclude(
        world.admin,
        `/api/v1/social/events/${fx.organizerEvent}/participants`,
        leaving.id,
        `PARTICIPATES link of the deleted user to event ${fx.organizerEvent}`,
      );
      await waitForNoLinks(
        world.admin,
        `/api/v1/social/users/${leaving.id}/events/wished`,
        'WISHES links of the deleted user',
      );
      await waitForNoLinks(
        world.admin,
        `/api/v1/social/users/${leaving.id}/events/participated`,
        'PARTICIPATES links of the deleted user',
      );
      await waitForSocialIdsToExclude(
        world.admin,
        `/api/v1/social/posts/${fx.organizerPost}/likers`,
        leaving.id,
        `LIKES link of the deleted user to post ${fx.organizerPost}`,
      );
      const summary = await eventually(
        async () => {
          const res = await organizer.client
            .post('/api/v1/social/likes-summary')
            .send({ postIds: [fx.organizerPost] })
            .expect(200);
          return (res.body as GetPostsLikeSummaryResponse).summaries[0];
        },
        (entry) => entry.likeCount === 1,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `like count of post ${fx.organizerPost} back to 1`,
        },
      );
      expect(summary.postId).toBe(fx.organizerPost);

      // OWN / CREATED links, nodes of the content and the link between P3 and E1.
      await waitForNoLinks(
        world.admin,
        `/api/v1/social/users/${leaving.id}/posts`,
        'OWN links of the deleted user',
      );
      await waitForNoLinks(
        world.admin,
        `/api/v1/social/users/${leaving.id}/events/created`,
        'CREATED links of the deleted user',
      );
      for (const postId of [fx.post1, fx.post2, fx.post3]) {
        await waitForNodeGone(`/api/v1/social/posts/${postId}`, `social node of post ${postId}`);
      }
      for (const eventId of [fx.event1, fx.event2]) {
        await waitForNodeGone(
          `/api/v1/social/events/${eventId}`,
          `social node of event ${eventId}`,
        );
      }
      await waitForNoLinks(
        world.admin,
        `/api/v1/social/events/${fx.event1}/related-posts`,
        `LINK_TO_EVENT links of the deleted event ${fx.event1}`,
      );
      await eventually(
        async () => {
          const res = await world.admin.get(`/api/v1/social/posts/${fx.post3}/related-event`);
          return res.status !== 200 || (res.body as { eventId: string }).eventId !== fx.event1;
        },
        (unlinked) => unlinked,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `post ${fx.post3} no longer related to ${fx.event1}`,
        },
      );

      // Control relations, unrelated to the deleted user.
      await waitForSocialUserNode(world.admin, friend.id);
      expect(
        await readSocialIds(world.admin, `/api/v1/social/users/${bystander.id}/follows`),
      ).toContain(friend.id);
      expect(
        await readSocialIds(world.admin, `/api/v1/social/users/${friend.id}/followers`),
      ).toContain(bystander.id);
      expect(
        await readSocialIds(world.admin, `/api/v1/social/posts/${fx.organizerPost}/likers`),
      ).toContain(friend.id);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'post: the posts are purged, the comments on the posts of others are anonymized and kept',
    async () => {
      for (const postId of [fx.post1, fx.post2, fx.post3]) {
        await waitForStatus(
          fx.bystander.client,
          `/api/v1/posts/${postId}`,
          404,
          `post ${postId} gone`,
        );
      }
      await eventually(
        async () => {
          const res = await fx.bystander.client
            .get(`/api/v1/posts?authorId=${fx.leaving.id}&limit=100`)
            .expect(200);
          return (res.body as ListPostsWebResponse).posts.map((post) => post.id);
        },
        (ids) => ids.length === 0,
        { timeoutMs: SAGA_WAIT_MS, description: `no post of ${fx.leaving.id} in the post list` },
      );

      // The comment of the deleted user on the post of another user stays, without its author.
      const comments = await eventually(
        async () => {
          const res = await fx.bystander.client
            .get(`/api/v1/posts/${fx.organizerPost}/comments?limit=100`)
            .expect(200);
          return (res.body as ListCommentsWebResponse).comments;
        },
        (list) =>
          list.find((comment) => comment.id === fx.leavingComment.id)?.authorId === DELETED_USER_ID,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `comment ${fx.leavingComment.id} anonymized on post ${fx.organizerPost}`,
        },
      );
      const anonymized = comments.find((comment) => comment.id === fx.leavingComment.id);
      expect(anonymized?.content).toBe(DELETED_COMMENT_PLACEHOLDER);
      expect(anonymized?.content).not.toBe(fx.leavingComment.content);
      const untouched = comments.find((comment) => comment.id === fx.friendComment.id);
      expect(untouched).toMatchObject({
        authorId: fx.friend.id,
        content: fx.friendComment.content,
      });

      // The comment of a control user on a purged post goes with the post.
      await eventually(
        async () => {
          const res = await fx.bystander.client.get(`/api/v1/posts/${fx.post1}/comments?limit=100`);
          return res.status === 200
            ? (res.body as ListCommentsWebResponse).comments.map((comment) => comment.id)
            : [];
        },
        (ids) => !ids.includes(fx.friendCommentOnPost1),
        { timeoutMs: SAGA_WAIT_MS, description: `comment on the purged post ${fx.post1} gone` },
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'event: the events are deleted (also the one with participants) and leave the searches and lists',
    async () => {
      for (const eventId of [fx.event1, fx.event2]) {
        await waitForStatus(
          fx.bystander.client,
          `/api/v1/events/${eventId}`,
          404,
          `event ${eventId} gone`,
        );
      }

      const found = await eventually(
        () => searchEventIds(fx.bystander.client, geo.scopeQuery),
        (ids) => !ids.includes(fx.event1) && !ids.includes(fx.event2),
        { timeoutMs: SAGA_WAIT_MS, description: 'deleted events gone from the area search' },
      );
      // The event of another organizer, joined by the deleted user, is still searchable.
      expect(found).toContain(fx.organizerEvent);

      // The participant of the deleted event no longer lists it.
      const participated = await eventually(
        async () => {
          const res = await fx.friend.client.get('/api/v1/events/participated/me').expect(200);
          return (res.body as EventIdsBody).events.map((event) => event.id);
        },
        (ids) => !ids.includes(fx.event1),
        { timeoutMs: SAGA_WAIT_MS, description: `event ${fx.event1} gone from participated/me` },
      );
      expect(participated).not.toContain(fx.event2);

      // The event of the control organizer is intact.
      await fx.organizer.client.get(`/api/v1/events/${fx.organizerEvent}`).expect(200);
      expect(
        await readSocialIds(world.admin, `/api/v1/social/events/${fx.organizerEvent}/participants`),
      ).toEqual(expect.arrayContaining([fx.bystander.id]));
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'storage: the avatar, the post media and the event cover are no longer attached',
    async () => {
      // Read as the owner: the forged token of the deleted user still reaches ms-storage.
      for (const [label, fileId] of [
        ['avatar', fx.avatarFileId],
        ['post media', fx.postMediaFileId],
        ['event cover', fx.coverFileId],
      ] as const) {
        await eventually(
          () => readFile(fx.leaving.client, fileId),
          (read) =>
            read.status === 404 ||
            (read.file !== undefined &&
              [FILE_STATUS_ORPHANED, FILE_STATUS_DELETED].includes(
                fileStatusName(read.file.status),
              )),
          { timeoutMs: SAGA_WAIT_MS, description: `${label} file ${fileId} released` },
        );
      }
    },
    TEST_TIMEOUT_MS,
  );

  // Gap G5 (README), fixed: releaseForOwner writes a storage.cleanup_files job (domain-storage
  // 0.13.0) -> outbox-storage -> BullMQ -> worker-storage CleanupFilesHandler deletes the objects,
  // then marks the rows DELETED.
  it(
    'storage: the files of the deleted user are purged, the avatar is no longer downloadable',
    async () => {
      await eventually(
        () => readPublicObjectStatus(fx.avatarPublicUrl),
        (status) => status === 404 || status === 403,
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `public object of avatar ${fx.avatarFileId} removed`,
        },
      );
      for (const fileId of [fx.avatarFileId, fx.postMediaFileId, fx.coverFileId]) {
        await eventually(
          () => readFile(fx.leaving.client, fileId),
          (read) =>
            read.status === 404 ||
            (read.file !== undefined && fileStatusName(read.file.status) === FILE_STATUS_DELETED),
          { timeoutMs: SAGA_WAIT_MS, description: `file ${fileId} purged (DELETED)` },
        );
      }
    },
    TEST_TIMEOUT_MS,
  );

  itWithRanking(
    'ranking: the posts of the deleted user leave the feed of its follower',
    async () => {
      const leavingPosts = [fx.post1, fx.post2, fx.post3];
      const feed = await eventually(
        () => readRankingFeed(fx.friend.client),
        (read) =>
          read.status === 200 && read.body.posts.every((post) => !leavingPosts.includes(post.id)),
        {
          timeoutMs: SAGA_WAIT_MS,
          description: `posts of ${fx.leaving.id} gone from the feed of friend`,
        },
      );
      expect(feed.body.posts.map((post) => post.id)).not.toEqual(
        expect.arrayContaining(leavingPosts),
      );
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'others: the content and the relations of the control users are intact',
    async () => {
      const post = await fx.bystander.client.get(`/api/v1/posts/${fx.organizerPost}`).expect(200);
      expect((post.body as { post: { authorId: string } }).post.authorId).toBe(fx.organizer.id);
      await fx.bystander.client.get(`/api/v1/events/${fx.organizerEvent}`).expect(200);
      await waitForSocialUserNode(world.admin, fx.friend.id);
      await waitForSocialUserNode(world.admin, fx.organizer.id);
      expect(
        await readSocialIds(world.admin, `/api/v1/social/users/${fx.bystander.id}/follows`),
      ).toContain(fx.friend.id);
    },
    TEST_TIMEOUT_MS,
  );

  // No public REST route makes a domain purge fail (that needs a stopped container or an injected
  // fault, out of scope for this suite).
  it.todo(
    "failure: a domain that fails its purge sends 'user.deletion_failed' and the account stays PENDING_DELETION",
  );
});

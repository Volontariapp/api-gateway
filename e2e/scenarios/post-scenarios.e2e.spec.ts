import type { EventWebResponse } from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { recordSocketEvents, waitForSocketEvent } from '../helpers/ws-client.helper.js';
import { eventually } from '../helpers/eventually.helper.js';
import {
  waitForSocialEventNodeRemoved,
  waitForSocialIdsToContain,
  waitForSocialPostNode,
  waitForSocialPostNodeRemoved,
} from '../helpers/social-node.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { createComment, createPost } from '../post/post-test.helpers.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import {
  ensureSocialEventNode,
  ensureSocialPostNode,
  readSocialIds,
  waitForSocialIdsToExclude,
} from './helpers/social-graph.helper.js';
import type { EmitterAwarePayload } from './helpers/ws-events.js';
import { WS_EVENTS } from './helpers/ws-events.js';

/** Gather payload of post.created / post.deleted: the trigger payload (postId, userId, ...). */
interface PostWsPayload {
  postId: string;
}

interface CommentWsPayload extends EmitterAwarePayload {
  postId: string;
  commentId: string;
}

interface RelatedEventBody {
  eventId: string;
}

const SCENARIO_TIMEOUT_MS = 120_000;
const CONCURRENT_POSTS = 3;

/**
 * Post domain scenarios (catalogue: e2e/scenarios/README.md). Needs outbox-post (lot 2).
 *   post.created: POST /posts -> ms-post (event_queue, stream post-created) -> outbox-post
 *     -> ws-service opens the POST_CREATION gather, post-processor-social writes the node and
 *     POST_SOCIAL_CREATED -> outbox-social -> ws-service: 'post.created' to the author and to every
 *     other socket.
 *   post.deleted: same chain with POST_SOCIAL_DELETED and 'post.deleted'.
 *   post.comment.created / deleted: ms-post (event_queue) -> outbox-post -> ws-service, no gather.
 */
describe('Scenarios: posts (E2E)', () => {
  let world: ScenarioWorld;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
  });

  afterAll(async () => {
    await world.close();
  });

  const writePost = async (
    author: ScenarioActor,
    overrides: { eventId?: string } = {},
  ): Promise<string> => {
    const { postId } = await createPost(author.client, overrides);
    world.onClose(() => author.client.delete(`/api/v1/posts/${postId}`));
    return postId;
  };

  describe('needs outbox-post and outbox-event (lot 2)', () => {
    it(
      "publishing a post notifies its author and the other connected users with 'post.created'",
      async () => {
        const [author, reader] = await world.signUpMany(2);
        const [authorSocket, readerSocket] = await Promise.all([
          world.connect(author),
          world.connect(reader),
        ]);
        const authorFeed = recordSocketEvents<PostWsPayload>(authorSocket, WS_EVENTS.POST_CREATED);
        const readerFeed = recordSocketEvents<PostWsPayload>(readerSocket, WS_EVENTS.POST_CREATED);

        try {
          const postId = await writePost(author);

          await waitForSocialPostNode(world.admin, postId);
          await waitForSocialIdsToContain(
            world.admin,
            `/api/v1/social/users/${author.id}/posts`,
            postId,
            `OWN link from ${author.id} to post ${postId}`,
          );
          for (const [who, feed] of [
            ['author', authorFeed],
            ['reader', readerFeed],
          ] as const) {
            await eventually(
              () => Promise.resolve(feed.payloads),
              (payloads) => payloads.some((payload) => payload.postId === postId),
              { description: `'post.created' for the ${who} of post ${postId}` },
            );
          }
          // The gather completes once: one notification per socket for this post.
          expect(authorFeed.payloads.filter((payload) => payload.postId === postId)).toHaveLength(
            1,
          );
        } finally {
          authorFeed.stop();
          readerFeed.stop();
        }
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      "deleting a post removes it from REST and the graph and notifies with 'post.deleted'",
      async () => {
        const author = await world.signUp();
        const authorSocket = await world.connect(author);
        const postId = await writePost(author);
        await waitForSocialPostNode(world.admin, postId);

        const deleted = waitForSocketEvent<PostWsPayload>(
          authorSocket,
          WS_EVENTS.POST_DELETED,
          (payload) => payload.postId === postId,
          { description: `'post.deleted' for the author of post ${postId}` },
        );
        await author.client.delete(`/api/v1/posts/${postId}`).expect(200);

        await author.client.get(`/api/v1/posts/${postId}`).expect(404);
        await waitForSocialPostNodeRemoved(world.admin, postId);
        await waitForSocialIdsToExclude(
          world.admin,
          `/api/v1/social/users/${author.id}/posts`,
          postId,
          `OWN link of the deleted post ${postId}`,
        );
        await expect(deleted).resolves.toEqual(expect.objectContaining({ postId }));
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'ordering: a post deleted right after its creation never stays in the social graph',
      async () => {
        // post.created and post.deleted travel on two streams (post-created, post-deleted) read by
        // two consumer groups of post-processor-social: the deletion may be processed first.
        const author = await world.signUp();
        const authorSocket = await world.connect(author);
        const created = recordSocketEvents<PostWsPayload>(authorSocket, WS_EVENTS.POST_CREATED);
        const deleted = recordSocketEvents<PostWsPayload>(authorSocket, WS_EVENTS.POST_DELETED);

        try {
          const { postId } = await createPost(author.client);
          await author.client.delete(`/api/v1/posts/${postId}`).expect(200);
          await author.client.get(`/api/v1/posts/${postId}`).expect(404);

          // Both gathers complete only once post-processor-social handled both events.
          for (const [name, feed] of [
            ['post.created', created],
            ['post.deleted', deleted],
          ] as const) {
            await eventually(
              () => Promise.resolve(feed.payloads),
              (payloads) => payloads.some((payload) => payload.postId === postId),
              { description: `'${name}' for post ${postId} (both events processed)` },
            );
          }
          await waitForSocialPostNodeRemoved(world.admin, postId);
          await waitForSocialIdsToExclude(
            world.admin,
            `/api/v1/social/users/${author.id}/posts`,
            postId,
            `no OWN link left for the deleted post ${postId}`,
          );
        } finally {
          created.stop();
          deleted.stop();
        }
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'concurrent posts of one author are all linked to it and each one is notified',
      async () => {
        const author = await world.signUp();
        const authorSocket = await world.connect(author);
        const feed = recordSocketEvents<PostWsPayload>(authorSocket, WS_EVENTS.POST_CREATED);

        try {
          const postIds = await Promise.all(
            Array.from({ length: CONCURRENT_POSTS }, () => writePost(author)),
          );

          await eventually(
            () => readSocialIds(world.admin, `/api/v1/social/users/${author.id}/posts`),
            (ids) => postIds.every((id) => ids.includes(id)),
            { description: `OWN links of the ${String(CONCURRENT_POSTS)} concurrent posts` },
          );
          await eventually(
            () => Promise.resolve(feed.payloads.map((payload) => payload.postId)),
            (ids) => postIds.every((id) => ids.includes(id)),
            { description: `'post.created' for each of the ${String(CONCURRENT_POSTS)} posts` },
          );
        } finally {
          feed.stop();
        }
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'commenting notifies the commenter as emitter and the other users, deleting the comment too',
      async () => {
        const [author, commenter] = await world.signUpMany(2);
        const [authorSocket, commenterSocket] = await Promise.all([
          world.connect(author),
          world.connect(commenter),
        ]);
        const postId = await writePost(author);
        const created = {
          forCommenter: recordSocketEvents<CommentWsPayload>(
            commenterSocket,
            WS_EVENTS.COMMENT_CREATED,
          ),
          forAuthor: recordSocketEvents<CommentWsPayload>(authorSocket, WS_EVENTS.COMMENT_CREATED),
        };

        try {
          const { commentId } = await createComment(commenter.client, postId);
          const ownComment = (payload: CommentWsPayload): boolean =>
            payload.postId === postId && payload.commentId === commentId;

          const [toCommenter] = (
            await eventually(
              () => Promise.resolve(created.forCommenter.payloads.filter(ownComment)),
              (payloads) => payloads.length > 0,
              { description: `'post.comment.created' for the commenter of ${commentId}` },
            )
          ).slice(0, 1);
          const [toAuthor] = (
            await eventually(
              () => Promise.resolve(created.forAuthor.payloads.filter(ownComment)),
              (payloads) => payloads.length > 0,
              { description: `'post.comment.created' for the author of post ${postId}` },
            )
          ).slice(0, 1);
          expect(toCommenter.isEmitter).toBe(true);
          expect(toAuthor.isEmitter).toBe(false);

          const commentDeleted = waitForSocketEvent<CommentWsPayload>(
            authorSocket,
            WS_EVENTS.COMMENT_DELETED,
            ownComment,
            { description: `'post.comment.deleted' for the author of post ${postId}` },
          );
          await commenter.client
            .delete(`/api/v1/posts/${postId}/comments/${commentId}`)
            .expect(200);
          await expect(commentDeleted).resolves.toEqual(
            expect.objectContaining({ postId, commentId, isEmitter: false }),
          );
        } finally {
          created.forCommenter.stop();
          created.forAuthor.stop();
        }
      },
      SCENARIO_TIMEOUT_MS,
    );
    it(
      'deleting an event drops the links of its posts but keeps the posts readable (no cascade)',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const author = await world.signUp();
        const eventRes = await organizer.client
          .post('/api/v1/events')
          .send(createEventRequestFactory())
          .expect(201);
        const eventId = (eventRes.body as EventWebResponse).event.id;
        await ensureSocialEventNode(world.admin, eventId);
        const postIds = await Promise.all([
          writePost(author, { eventId }),
          writePost(author, { eventId }),
        ]);
        await eventually(
          () => readSocialIds(world.admin, `/api/v1/social/events/${eventId}/related-posts`),
          (ids) => postIds.every((id) => ids.includes(id)),
          { description: `LINK_TO_EVENT of both posts to event ${eventId}` },
        );

        await organizer.client.delete(`/api/v1/events/${eventId}`).expect(200);

        await waitForSocialEventNodeRemoved(world.admin, eventId);
        await world.admin.get(`/api/v1/social/events/${eventId}/related-posts`).expect(404);
        for (const postId of postIds) {
          const related = await world.admin.get(`/api/v1/social/posts/${postId}/related-event`);
          expect(
            related.status === 404 || (related.body as RelatedEventBody).eventId !== eventId,
          ).toBe(true);
        }
        for (const postId of postIds) {
          await author.client.get(`/api/v1/posts/${postId}`).expect(200);
        }
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('event and post links', () => {
    it(
      'a moderator links an existing post to an event, both directions resolve, then unlinks it',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const author = await world.signUp();
        const eventRes = await organizer.client
          .post('/api/v1/events')
          .send(createEventRequestFactory())
          .expect(201);
        const eventId = (eventRes.body as EventWebResponse).event.id;
        world.onClose(() => organizer.client.delete(`/api/v1/events/${eventId}`));
        await ensureSocialEventNode(world.admin, eventId);
        const postId = await writePost(author);
        await ensureSocialPostNode(world.admin, postId);
        const linkPath = `/api/v1/social/events/${eventId}/posts/${postId}`;
        const relatedPostsPath = `/api/v1/social/events/${eventId}/related-posts`;

        // Linking by hand is an admin route: the author links through post.eventId instead.
        await author.client.post(linkPath).expect(403);
        await world.admin.post(linkPath).expect(201);

        expect(await readSocialIds(world.admin, relatedPostsPath)).toContain(postId);
        const related = await world.admin
          .get(`/api/v1/social/posts/${postId}/related-event`)
          .expect(200);
        expect((related.body as RelatedEventBody).eventId).toBe(eventId);

        await world.admin.delete(linkPath).expect(200);
        expect(await readSocialIds(world.admin, relatedPostsPath)).not.toContain(postId);
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('needs post-processor-post, post-processor-storage, worker-storage and outbox-storage', () => {
    it.todo(
      'post with media: storage.file_scanned marks the media READY and GET /posts/:id exposes media[].url',
    );
    it.todo(
      "post with an infected file: storage.file_rejected marks the media REJECTED and the author receives 'storage.file_rejected'",
    );
    it.todo('post.deleted: post-processor-storage purges the media files of the deleted post');
    it.todo(
      "post.creation_successfull: the author's post badge is evaluated (outbox-ws -> post-processor-user)",
    );
  });
});

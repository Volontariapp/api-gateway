import type { EventWebResponse, GetPostsLikeSummaryResponse } from '@volontariapp/contracts';
import { EventState } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import { eventually } from '../helpers/eventually.helper.js';
import { recordSocketEvents, waitForSocketEvent } from '../helpers/ws-client.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { createPost } from '../post/post-test.helpers.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import { ensureSocialEventNode, ensureSocialPostNode } from './helpers/social-graph.helper.js';
import type { EmitterAwarePayload } from './helpers/ws-events.js';
import { WS_EVENTS } from './helpers/ws-events.js';

/** post.liked / post.unliked: authorId is the user who likes, not the author of the post. */
interface LikeWsPayload extends EmitterAwarePayload {
  postId: string;
  authorId: string;
}

interface WishedEventsBody {
  events: { id: string }[];
}

const SCENARIO_TIMEOUT_MS = 120_000;
const CONCURRENT_LIKERS = 3;

/**
 * Social domain scenarios (catalogue: e2e/scenarios/README.md).
 *   post.liked / post.unliked: POST|DELETE /social/likes/:postId -> ms-social (Neo4j, then
 *     event_queue in best effort) -> outbox-social (streams post-liked / post-unliked) -> ws-service
 *     sends { isEmitter: true } to the liker and broadcasts { isEmitter: false } to the others.
 *   event_social.wished / unwished: POST|DELETE /social/events/:id/wish -> ms-social -> outbox-social
 *     -> post-processor-ranking and post-processor-user (badges); no WebSocket notification.
 */
describe('Scenarios: social interactions (E2E)', () => {
  let world: ScenarioWorld;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
  });

  afterAll(async () => {
    await world.close();
  });

  /** A real post of `author` (ms-post) whose social node exists. */
  const publishPost = async (author: ScenarioActor): Promise<string> => {
    const { postId } = await createPost(author.client);
    world.onClose(() => author.client.delete(`/api/v1/posts/${postId}`));
    await ensureSocialPostNode(world.admin, postId);
    return postId;
  };

  const readLikeSummary = async (reader: ScenarioActor, postId: string) => {
    const res = await reader.client
      .post('/api/v1/social/likes-summary')
      .send({ postIds: [postId] })
      .expect(200);
    const [summary] = (res.body as GetPostsLikeSummaryResponse).summaries;
    return summary;
  };

  describe('likes', () => {
    it(
      'a like notifies the liker as emitter and the post author as a bystander, then counts once',
      async () => {
        const [author, liker] = await world.signUpMany(2);
        const [authorSocket, likerSocket] = await Promise.all([
          world.connect(author),
          world.connect(liker),
        ]);
        const postId = await publishPost(author);

        const forLiker = waitForSocketEvent<LikeWsPayload>(
          likerSocket,
          WS_EVENTS.POST_LIKED,
          (payload) => payload.postId === postId,
          { description: `'post.liked' for the liker of post ${postId}` },
        );
        const forAuthor = waitForSocketEvent<LikeWsPayload>(
          authorSocket,
          WS_EVENTS.POST_LIKED,
          (payload) => payload.postId === postId,
          { description: `'post.liked' for the author of post ${postId}` },
        );

        await liker.client.post(`/api/v1/social/likes/${postId}`).expect(201);

        await expect(forLiker).resolves.toEqual(
          expect.objectContaining({ postId, authorId: liker.id, isEmitter: true }),
        );
        await expect(forAuthor).resolves.toEqual(
          expect.objectContaining({ postId, authorId: liker.id, isEmitter: false }),
        );
        expect(await readLikeSummary(liker, postId)).toMatchObject({
          likeCount: 1,
          likedByMe: true,
        });
        expect(await readLikeSummary(author, postId)).toMatchObject({
          likeCount: 1,
          likedByMe: false,
        });
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'liking twice is refused and keeps a single like; unliking notifies and resets the count',
      async () => {
        const [author, liker] = await world.signUpMany(2);
        const likerSocket = await world.connect(liker);
        const postId = await publishPost(author);

        await liker.client.post(`/api/v1/social/likes/${postId}`).expect(201);
        await liker.client.post(`/api/v1/social/likes/${postId}`).expect(409);
        expect(await readLikeSummary(liker, postId)).toMatchObject({ likeCount: 1 });

        const unliked = waitForSocketEvent<LikeWsPayload>(
          likerSocket,
          WS_EVENTS.POST_UNLIKED,
          (payload) => payload.postId === postId,
          { description: `'post.unliked' for the liker of post ${postId}` },
        );
        await liker.client.delete(`/api/v1/social/likes/${postId}`).expect(200);

        await expect(unliked).resolves.toEqual(
          expect.objectContaining({ postId, authorId: liker.id, isEmitter: true }),
        );
        expect(await readLikeSummary(liker, postId)).toMatchObject({
          likeCount: 0,
          likedByMe: false,
        });
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'concurrent likes on the same post are all counted and each liker is told it is the emitter',
      async () => {
        const author = await world.signUp();
        const likers = await world.signUpMany(CONCURRENT_LIKERS);
        const sockets = await Promise.all(likers.map((liker) => world.connect(liker)));
        const postId = await publishPost(author);
        const recorders = sockets.map((socket) =>
          recordSocketEvents<LikeWsPayload>(socket, WS_EVENTS.POST_LIKED),
        );

        try {
          await Promise.all(
            likers.map((liker) => liker.client.post(`/api/v1/social/likes/${postId}`).expect(201)),
          );

          expect(await readLikeSummary(author, postId)).toMatchObject({
            likeCount: CONCURRENT_LIKERS,
          });
          await Promise.all(
            likers.map((liker, index) =>
              eventually(
                () => Promise.resolve(recorders[index].payloads),
                (payloads) =>
                  payloads.some(
                    (payload) =>
                      payload.postId === postId &&
                      payload.authorId === liker.id &&
                      payload.isEmitter === true,
                  ),
                { description: `own 'post.liked' (isEmitter) for liker ${liker.id}` },
              ),
            ),
          );
          // Each liker sees the likes of the others as a bystander, never as the emitter.
          likers.forEach((liker, index) => {
            const foreign = recorders[index].payloads.filter(
              (payload) => payload.postId === postId && payload.authorId !== liker.id,
            );
            expect(foreign.every((payload) => payload.isEmitter === false)).toBe(true);
          });
        } finally {
          recorders.forEach((recorder) => {
            recorder.stop();
          });
        }
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('wishes', () => {
    it(
      'wishing a published event lists it in the wished events, once, until it is unwished',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const volunteer = await world.signUp();
        const created = await organizer.client
          .post('/api/v1/events')
          .send(createEventRequestFactory())
          .expect(201);
        const eventId = (created.body as EventWebResponse).event.id;
        world.onClose(() => organizer.client.delete(`/api/v1/events/${eventId}`));
        await organizer.client
          .patch(`/api/v1/events/${eventId}/state`)
          .send({ newState: EventState.EVENT_STATE_PUBLISHED })
          .expect(200);
        await ensureSocialEventNode(world.admin, eventId);

        const wishedIds = async (): Promise<string[]> => {
          const res = await volunteer.client.get('/api/v1/events/wished/me').expect(200);
          return (res.body as WishedEventsBody).events.map((event) => event.id);
        };

        await volunteer.client.post(`/api/v1/social/events/${eventId}/wish`).expect(201);
        const second = await volunteer.client.post(`/api/v1/social/events/${eventId}/wish`);
        expect([201, 409]).toContain(second.status);
        expect((await wishedIds()).filter((id) => id === eventId)).toHaveLength(1);

        await volunteer.client.delete(`/api/v1/social/events/${eventId}/wish`).expect(200);
        expect(await wishedIds()).not.toContain(eventId);
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('needs post-processor-user (badges) and a ranking read model exposed by REST', () => {
    it.todo('event_social.wished: the first wish awards the matching badge (user.badge_awarded)');
    it.todo('post.liked: the liked author earns the like badge at its threshold');
    it.todo('event_social.wished / unwished: GET /ranking/events reflects the wish of the user');
  });
});

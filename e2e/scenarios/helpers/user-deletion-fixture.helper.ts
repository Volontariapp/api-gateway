import type {
  EventWebResponse,
  GetRankingFeedWebResponse,
  GetPostsLikeSummaryResponse,
} from '@volontariapp/contracts';
import { EntityType, EventState } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import { eventually } from '../../helpers/eventually.helper.js';
import type { TestClient } from '../../helpers/test-client.helper.js';
import {
  waitForSocialEventNode,
  waitForSocialIdsToContain,
  waitForSocialPostNode,
} from '../../helpers/social-node.helper.js';
import { areaQuery, type CityGeo, type SuiteGeo } from '../../event/event-search.helper.js';
import { createEventRequestFactory } from '../../event/event-test.factory.js';
import { createComment, createPost } from '../../post/post-test.helpers.js';
import type { ScenarioActor, ScenarioWorld } from './scenario-world.helper.js';
import { readSocialIds } from './social-graph.helper.js';
import {
  FILE_STATUS_ATTACHED,
  readFile,
  readPublicObjectStatus,
  uploadConfirmedImage,
  waitForFileStatus,
} from './storage-upload.helper.js';

const RANKING_FEED_PATH = '/api/v1/ranking/feed?limit=50';
/** A compute job goes through outbox-ranking, BullMQ and worker-ranking (see async/ranking-feed). */
const RANKING_TIMEOUT_MS = 60_000;
const ATTACHMENT_TIMEOUT_MS = 60_000;

export interface RankingFeedRead {
  status: number;
  body: GetRankingFeedWebResponse;
}

export async function readRankingFeed(client: TestClient): Promise<RankingFeedRead> {
  const res = await client.get(RANKING_FEED_PATH);
  return { status: res.status, body: res.body as GetRankingFeedWebResponse };
}

/**
 * Everything the account deletion scenario reads afterwards. `leaving` is the user that deletes
 * its account; the others are control users whose data must survive or lose only what links them
 * to `leaving`.
 */
export interface DeletionFixture {
  readonly leaving: ScenarioActor;
  readonly friend: ScenarioActor;
  readonly organizer: ScenarioActor;
  readonly blocked: ScenarioActor;
  readonly bystander: ScenarioActor;
  /** Posts of `leaving`: plain, with one media file, linked to `event1`. */
  readonly post1: string;
  readonly post2: string;
  readonly post3: string;
  /** Post of `organizer`, liked and commented by `leaving`, liked and commented by `friend`. */
  readonly organizerPost: string;
  /** Events of `leaving`: `event1` has a cover and a participant (`friend`), `event2` is plain. */
  readonly event1: string;
  readonly event2: string;
  /** Event of `organizer` joined and wished by `leaving`, joined by `bystander`. */
  readonly organizerEvent: string;
  readonly avatarFileId: string;
  /** Public URL of the avatar, readable anonymously before the deletion. */
  readonly avatarPublicUrl: string;
  readonly postMediaFileId: string;
  readonly coverFileId: string;
  /** Comment of `leaving` on `organizerPost` (anonymized, kept). */
  readonly leavingComment: { id: string; content: string };
  /** Comment of `friend` on `organizerPost` (untouched). */
  readonly friendComment: { id: string; content: string };
  /** Comment of `friend` on `post1` (disappears with the post). */
  readonly friendCommentOnPost1: string;
}

async function createLocatedEvent(
  world: ScenarioWorld,
  organizer: ScenarioActor,
  city: CityGeo,
  coverFileId?: string,
): Promise<string> {
  const res = await organizer.client
    .post('/api/v1/events')
    .send(createEventRequestFactory({ coverFileId }))
    .expect(201);
  const eventId = (res.body as EventWebResponse).event.id;
  await organizer.client
    .patch(`/api/v1/events/${eventId}/state`)
    .send({ newState: EventState.EVENT_STATE_PUBLISHED })
    .expect(200);
  await organizer.client
    .patch(`/api/v1/events/${eventId}`)
    .send({ latitude: city.lat, longitude: city.lng })
    .expect(200);
  // The node and the CREATED link come from the pipeline, never from the test.
  await waitForSocialEventNode(world.admin, eventId);
  await waitForSocialIdsToContain(
    world.admin,
    `/api/v1/social/users/${organizer.id}/events/created`,
    eventId,
    `CREATED link from ${organizer.id} to event ${eventId}`,
  );
  return eventId;
}

async function createPostWithNode(
  world: ScenarioWorld,
  author: ScenarioActor,
  overrides: { fileIds?: string[]; eventId?: string } = {},
): Promise<string> {
  const { postId } = await createPost(author.client, overrides);
  await waitForSocialPostNode(world.admin, postId);
  return postId;
}

/**
 * Builds the world of the deletion scenario through the real routes only: every social node and
 * link is written by the runners (or by the normal user routes), never by an admin write.
 */
export async function buildDeletionFixture(
  world: ScenarioWorld,
  geo: SuiteGeo,
  options: { rankingEnabled: boolean },
): Promise<DeletionFixture> {
  const [leaving, organizer] = await Promise.all([
    world.signUp(UserRoles.ORGANIZATION),
    world.signUp(UserRoles.ORGANIZATION),
  ]);
  const [friend, blocked, bystander] = await world.signUpMany(3);

  // 1. Avatar: upload, confirm, attach through the profile update, wait for the attachment.
  const avatarFileId = await uploadConfirmedImage(
    leaving.client,
    EntityType.ENTITY_TYPE_USER_AVATAR,
  );
  await leaving.client.patch('/api/v1/users/me').send({ avatarFileId }).expect(200);

  // 2. Relations through the normal user routes.
  await leaving.client.post(`/api/v1/social/follow/${friend.id}`).expect(201);
  await leaving.client.post(`/api/v1/social/follow/${organizer.id}`).expect(201);
  await friend.client.post(`/api/v1/social/follow/${leaving.id}`).expect(201);
  await bystander.client.post(`/api/v1/social/follow/${friend.id}`).expect(201);
  await leaving.client.post(`/api/v1/social/block/${blocked.id}`).expect(201);

  // 5 (first half). The fan-out of post.created only reaches an existing feed list of a follower:
  // compute the feed of `friend` before `leaving` publishes.
  if (options.rankingEnabled) {
    await eventually(
      () => readRankingFeed(friend.client),
      (read) => read.status === 200,
      { timeoutMs: RANKING_TIMEOUT_MS, description: `first feed list of friend ${friend.id}` },
    );
  }

  // 4 (organizer side). Created first so that `leaving` can interact with them.
  const organizerEvent = await createLocatedEvent(world, organizer, geo.lyon);
  const organizerPost = await createPostWithNode(world, organizer);

  // 3. Content of `leaving`.
  const postMediaFileId = await uploadConfirmedImage(leaving.client, EntityType.ENTITY_TYPE_POST);
  const coverFileId = await uploadConfirmedImage(
    leaving.client,
    EntityType.ENTITY_TYPE_EVENT_COVER,
  );
  const event1 = await createLocatedEvent(world, leaving, geo.paris, coverFileId);
  const event2 = await createLocatedEvent(world, leaving, geo.paris);
  const post1 = await createPostWithNode(world, leaving);
  const post2 = await createPostWithNode(world, leaving, { fileIds: [postMediaFileId] });
  const post3 = await createPostWithNode(world, leaving, { eventId: event1 });
  await waitForSocialIdsToContain(
    world.admin,
    `/api/v1/social/events/${event1}/related-posts`,
    post3,
    `LINK_TO_EVENT from post ${post3} to event ${event1}`,
  );
  await friend.client.post(`/api/v1/social/events/${event1}/participate`).expect(201);

  // 4. Interactions of `leaving` on the content of others, and the controls.
  await leaving.client.post(`/api/v1/social/events/${organizerEvent}/participate`).expect(201);
  await leaving.client.post(`/api/v1/social/events/${organizerEvent}/wish`).expect(201);
  await bystander.client.post(`/api/v1/social/events/${organizerEvent}/participate`).expect(201);
  await leaving.client.post(`/api/v1/social/likes/${organizerPost}`).expect(201);
  await friend.client.post(`/api/v1/social/likes/${organizerPost}`).expect(201);
  const leavingComment = await createComment(leaving.client, organizerPost);
  const friendComment = await createComment(friend.client, organizerPost);
  const friendCommentOnPost1 = await createComment(friend.client, post1);

  // Wait until the runners attached the three files: the later absence of ATTACHED means something.
  await Promise.all(
    [avatarFileId, postMediaFileId, coverFileId].map((fileId) =>
      waitForFileStatus(leaving.client, fileId, [FILE_STATUS_ATTACHED], ATTACHMENT_TIMEOUT_MS),
    ),
  );
  // The avatar is publicly readable while the account exists: its later absence means something.
  const avatarPublicUrl = (await readFile(leaving.client, avatarFileId)).file?.publicUrl;
  if (!avatarPublicUrl) {
    throw new Error(`avatar ${avatarFileId} has no public URL once attached and CLEAN`);
  }
  expect(await readPublicObjectStatus(avatarPublicUrl)).toBe(200);

  // 5 (second half). A post of `leaving` must be in the feed of `friend` before the deletion.
  if (options.rankingEnabled) {
    const leavingPosts = [post1, post2, post3];
    await eventually(
      () => readRankingFeed(friend.client),
      (read) =>
        read.status === 200 && read.body.posts.some((post) => leavingPosts.includes(post.id)),
      {
        timeoutMs: RANKING_TIMEOUT_MS,
        description: `a post of ${leaving.id} in the feed of friend ${friend.id}`,
      },
    );
  }

  await assertGraphBeforeDeletion({
    leaving,
    friend,
    organizer,
    blocked,
    bystander,
    organizerPost,
    organizerEvent,
    world,
    geo,
    eventIds: [event1, event2],
  });

  return {
    leaving,
    friend,
    organizer,
    blocked,
    bystander,
    post1,
    post2,
    post3,
    organizerPost,
    event1,
    event2,
    organizerEvent,
    avatarFileId,
    avatarPublicUrl,
    postMediaFileId,
    coverFileId,
    leavingComment: { id: leavingComment.commentId, content: leavingComment.dto.content },
    friendComment: { id: friendComment.commentId, content: friendComment.dto.content },
    friendCommentOnPost1: friendCommentOnPost1.commentId,
  };
}

interface BeforeDeletion {
  world: ScenarioWorld;
  geo: SuiteGeo;
  leaving: ScenarioActor;
  friend: ScenarioActor;
  organizer: ScenarioActor;
  blocked: ScenarioActor;
  bystander: ScenarioActor;
  organizerPost: string;
  organizerEvent: string;
  eventIds: string[];
}

/** Proves the links exist before the deletion, so that their later absence is not vacuous. */
async function assertGraphBeforeDeletion(state: BeforeDeletion): Promise<void> {
  const { world, leaving, friend, organizer, blocked, bystander } = state;
  expect(await readSocialIds(world.admin, `/api/v1/social/users/${friend.id}/follows`)).toContain(
    leaving.id,
  );
  expect(await readSocialIds(world.admin, `/api/v1/social/users/${friend.id}/followers`)).toEqual(
    expect.arrayContaining([leaving.id, bystander.id]),
  );
  expect(
    await readSocialIds(world.admin, `/api/v1/social/users/${organizer.id}/followers`),
  ).toContain(leaving.id);
  expect(await readSocialIds(blocked.client, '/api/v1/social/who-blocked-me')).toContain(
    leaving.id,
  );
  expect(
    await readSocialIds(world.admin, `/api/v1/social/events/${state.organizerEvent}/participants`),
  ).toEqual(expect.arrayContaining([leaving.id, bystander.id]));
  expect(
    await readSocialIds(world.admin, `/api/v1/social/posts/${state.organizerPost}/likers`),
  ).toEqual(expect.arrayContaining([leaving.id, friend.id]));
  const summary = await organizer.client
    .post('/api/v1/social/likes-summary')
    .send({ postIds: [state.organizerPost] })
    .expect(200);
  expect((summary.body as GetPostsLikeSummaryResponse).summaries[0].likeCount).toBe(2);

  // The two events of `leaving` are found by the area search of their city.
  const found = await searchEventIds(bystander.client, areaQuery(state.geo.paris));
  expect(found).toEqual(expect.arrayContaining(state.eventIds));
}

/** Ids of the events found by `GET /events` with `areaQueryString`. */
export async function searchEventIds(
  client: TestClient,
  areaQueryString: string,
): Promise<string[]> {
  const res = await client.get(`/api/v1/events?${areaQueryString}&limit=50`).expect(200);
  return (res.body as { events: { id: string }[] }).events.map((event) => event.id);
}

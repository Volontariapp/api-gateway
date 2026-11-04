import type { IdsListWebResponse } from '@volontariapp/contracts';
import type { TestClient } from '../../helpers/test-client.helper.js';
import { eventually } from '../../helpers/eventually.helper.js';
import { waitForSocialEventNode, waitForSocialPostNode } from '../../helpers/social-node.helper.js';

interface SocialNodeExistsBody {
  exists: boolean;
}

/** 201: the test wrote the node. 409: post-processor-social wrote it first (MERGE). */
const NODE_WRITTEN_STATUSES = [201, 409];

/**
 * Makes sure the social node of a real post exists, whichever runs first: the pipeline
 * (post.created -> outbox-post -> post-processor-social) when outbox-post is in the stack, or this
 * admin write when it is not. Only for scenarios about something else (likes, links): the
 * pipeline itself is asserted with `waitForSocialPostNode`, never through this helper.
 */
export async function ensureSocialPostNode(admin: TestClient, postId: string): Promise<void> {
  const res = await admin.post(`/api/v1/social/posts/${postId}`).send({});
  expect(NODE_WRITTEN_STATUSES).toContain(res.status);
  await waitForSocialPostNode(admin, postId);
}

/** Same as `ensureSocialPostNode` for an event (event.created -> outbox-event). */
export async function ensureSocialEventNode(admin: TestClient, eventId: string): Promise<void> {
  const res = await admin.post(`/api/v1/social/events/${eventId}`).send({});
  expect(NODE_WRITTEN_STATUSES).toContain(res.status);
  await waitForSocialEventNode(admin, eventId);
}

/** user.deleted -> outbox-user (stream social:user) -> post-processor-social (DETACH DELETE). */
export async function waitForSocialUserNodeRemoved(
  admin: TestClient,
  userId: string,
): Promise<void> {
  await eventually(
    async () => {
      const res = await admin.get(`/api/v1/social/users/${userId}`).expect(200);
      return res.body as SocialNodeExistsBody;
    },
    (body) => !body.exists,
    { description: `removal of the social node of user ${userId}` },
  );
}

/** Polls an ids list route of ms-social until it no longer contains `id`. */
export async function waitForSocialIdsToExclude(
  client: TestClient,
  path: string,
  id: string,
  description: string,
): Promise<void> {
  await eventually(
    async () => {
      const res = await client.get(path).expect(200);
      return res.body as IdsListWebResponse;
    },
    (body) => !body.ids.includes(id),
    { description },
  );
}

/** Reads an ids list route of ms-social once. */
export async function readSocialIds(client: TestClient, path: string): Promise<string[]> {
  const res = await client.get(path).expect(200);
  return (res.body as IdsListWebResponse).ids;
}

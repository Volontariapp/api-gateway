import type { IdsListWebResponse } from '@volontariapp/contracts';
import type { TestClient } from './test-client.helper.js';
import { eventually } from './eventually.helper.js';

interface SocialNodeExistsBody {
  exists: boolean;
}

/**
 * Polls an existence route of ms-social (`{ exists: boolean }`) until it answers `expected`.
 * The nodes of real users, events and posts are written by the async pipeline
 * (outbox-* -> Redis stream -> post-processor-social), never by the test: creating or deleting
 * them by hand races with the post-processor (409 or 404 when it wins).
 */
async function waitForNodeExistence(
  client: TestClient,
  path: string,
  expected: boolean,
  description: string,
): Promise<void> {
  await eventually(
    async () => {
      const res = await client.get(path).expect(200);
      return res.body as SocialNodeExistsBody;
    },
    (body) => body.exists === expected,
    { description },
  );
}

/** user.created -> outbox-user -> post-processor-social. */
export async function waitForSocialUserNode(admin: TestClient, userId: string): Promise<void> {
  await waitForNodeExistence(
    admin,
    `/api/v1/social/users/${userId}`,
    true,
    `social node for user ${userId}`,
  );
}

/** event.created -> outbox-event -> post-processor-social. */
export async function waitForSocialEventNode(client: TestClient, eventId: string): Promise<void> {
  await waitForNodeExistence(
    client,
    `/api/v1/social/events/${eventId}`,
    true,
    `social node for event ${eventId}`,
  );
}

/** event.deleted -> outbox-event -> post-processor-social (DETACH DELETE). */
export async function waitForSocialEventNodeRemoved(
  client: TestClient,
  eventId: string,
): Promise<void> {
  await waitForNodeExistence(
    client,
    `/api/v1/social/events/${eventId}`,
    false,
    `removal of the social node of event ${eventId}`,
  );
}

/** post.created -> outbox-post -> post-processor-social. */
export async function waitForSocialPostNode(client: TestClient, postId: string): Promise<void> {
  await waitForNodeExistence(
    client,
    `/api/v1/social/posts/${postId}`,
    true,
    `social node for post ${postId}`,
  );
}

/** post.deleted -> outbox-post -> post-processor-social (DETACH DELETE). */
export async function waitForSocialPostNodeRemoved(
  client: TestClient,
  postId: string,
): Promise<void> {
  await waitForNodeExistence(
    client,
    `/api/v1/social/posts/${postId}`,
    false,
    `removal of the social node of post ${postId}`,
  );
}

/**
 * Polls an ids list route of ms-social (`{ ids: string[] }`) until it contains `id`, for the
 * relations written by the pipeline (CREATED link of an organizer, OWN link of an author,
 * LINK_TO_EVENT of a post). `path` must read a list scoped to data the test created.
 */
export async function waitForSocialIdsToContain(
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
    (body) => body.ids.includes(id),
    { description },
  );
}

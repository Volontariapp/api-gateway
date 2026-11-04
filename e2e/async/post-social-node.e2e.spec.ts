import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EventWebResponse } from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import {
  waitForSocialEventNode,
  waitForSocialIdsToContain,
  waitForSocialPostNode,
  waitForSocialPostNodeRemoved,
  waitForSocialUserNode,
} from '../helpers/social-node.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { createPost } from '../post/post-test.helpers.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';

interface RelatedEventBody {
  eventId: string;
}

/**
 * Async pipeline: post.created and post.deleted
 *   POST /posts -> ms-post (event_queue of ms_post, target post:created)
 *   -> outbox-post (pushes to the Redis stream) -> post-processor-social
 *      (MERGE of the SocialPost node, OWN link from the author node, LINK_TO_EVENT when the post
 *      names an event whose node already exists).
 *   DELETE /posts/:id -> ms-post (event_queue, target post:deleted) -> outbox-post
 *   -> post-processor-social (DETACH DELETE of the node).
 * The post node and its links are never created by the test: they must come from the pipeline.
 */
describe('Async pipeline: post.created / post.deleted -> ms-social (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  const createdUserIds: string[] = [];

  /** A real author whose social node already exists, so that the OWN link can be written. */
  const createAuthor = async (): Promise<{ id: string; client: TestClient }> => {
    const res = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
    const id = (res.body as SignUpResponseDTO).user.id;
    createdUserIds.push(id);
    await waitForSocialUserNode(admin, id);
    const client = await createTestClient(app).login({ id, role: UserRoles.VOLUNTEER });
    return { id, client };
  };

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.delete(`/api/v1/users/${id}`)));
    await app.close();
  });

  it('creates the social post node and links it to its author', async () => {
    const author = await createAuthor();
    const { postId } = await createPost(author.client);

    try {
      await waitForSocialPostNode(admin, postId);
      await waitForSocialIdsToContain(
        admin,
        `/api/v1/social/users/${author.id}/posts`,
        postId,
        `OWN link from author ${author.id} to post ${postId}`,
      );
    } finally {
      await author.client.delete(`/api/v1/posts/${postId}`);
    }
  });

  it('links a post to the event it names', async () => {
    const author = await createAuthor();
    const eventRes = await author.client
      .post('/api/v1/events')
      .send(createEventRequestFactory())
      .expect(201);
    const eventId = (eventRes.body as EventWebResponse).event.id;
    // LINK_TO_EVENT is only written when the event node exists when post.created is processed.
    await waitForSocialEventNode(admin, eventId);

    const { postId } = await createPost(author.client, { eventId });

    try {
      await waitForSocialIdsToContain(
        admin,
        `/api/v1/social/events/${eventId}/related-posts`,
        postId,
        `LINK_TO_EVENT from post ${postId} to event ${eventId}`,
      );
      const related = await admin.get(`/api/v1/social/posts/${postId}/related-event`).expect(200);
      expect((related.body as RelatedEventBody).eventId).toBe(eventId);
    } finally {
      await author.client.delete(`/api/v1/posts/${postId}`);
      await author.client.delete(`/api/v1/events/${eventId}`);
    }
  });

  it('removes the social post node once the post is deleted', async () => {
    const author = await createAuthor();
    const { postId } = await createPost(author.client);
    await waitForSocialPostNode(admin, postId);

    await author.client.delete(`/api/v1/posts/${postId}`).expect(200);

    await expect(waitForSocialPostNodeRemoved(admin, postId)).resolves.toBeUndefined();
  });
});

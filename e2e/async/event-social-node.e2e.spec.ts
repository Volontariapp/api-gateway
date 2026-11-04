import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EventWebResponse } from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import {
  waitForSocialEventNode,
  waitForSocialEventNodeRemoved,
  waitForSocialIdsToContain,
  waitForSocialUserNode,
} from '../helpers/social-node.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';

/**
 * Async pipeline: event.created and event.deleted
 *   POST /events -> ms-event (event_queue of ms_event, target event:created)
 *   -> outbox-event (pushes to the Redis stream) -> post-processor-social
 *      (MERGE of the SocialEvent node, then CREATED link from the organizer node when it exists).
 *   DELETE /events/:id -> ms-event (event_queue, target event:deleted) -> outbox-event
 *   -> post-processor-social (DETACH DELETE of the node).
 * The event node and its links are never created by the test: they must come from the pipeline.
 */
describe('Async pipeline: event.created / event.deleted -> ms-social (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  const createdUserIds: string[] = [];

  /** A real organizer whose social node already exists, so that the CREATED link can be written. */
  const createOrganizer = async (): Promise<{ id: string; client: TestClient }> => {
    const res = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
    const id = (res.body as SignUpResponseDTO).user.id;
    createdUserIds.push(id);
    await waitForSocialUserNode(admin, id);
    const client = await createTestClient(app).login({ id, role: UserRoles.ORGANIZATION });
    return { id, client };
  };

  const createEvent = async (organizer: TestClient): Promise<string> => {
    const res = await organizer
      .post('/api/v1/events')
      .send(createEventRequestFactory())
      .expect(201);
    return (res.body as EventWebResponse).event.id;
  };

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.delete(`/api/v1/users/${id}`)));
    await app.close();
  });

  it('creates the social event node and links it to its organizer', async () => {
    const organizer = await createOrganizer();
    const eventId = await createEvent(organizer.client);

    try {
      await waitForSocialEventNode(admin, eventId);
      await waitForSocialIdsToContain(
        admin,
        `/api/v1/social/users/${organizer.id}/events/created`,
        eventId,
        `CREATED link from organizer ${organizer.id} to event ${eventId}`,
      );
    } finally {
      await organizer.client.delete(`/api/v1/events/${eventId}`);
    }
  });

  it('removes the social event node once the event is deleted', async () => {
    const organizer = await createOrganizer();
    const eventId = await createEvent(organizer.client);
    await waitForSocialEventNode(admin, eventId);

    await organizer.client.delete(`/api/v1/events/${eventId}`).expect(200);

    await expect(waitForSocialEventNodeRemoved(admin, eventId)).resolves.toBeUndefined();
  });
});

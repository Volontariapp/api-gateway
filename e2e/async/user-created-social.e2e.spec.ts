import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { waitForSocialUserNode } from '../helpers/social-node.helper.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';

/**
 * Async pipeline: user.created
 *   POST /users -> ms-user (SQL trigger writes event_queue, target social:user)
 *   -> outbox-user (pushes to the Redis stream) -> post-processor-social (creates the Neo4j node).
 * The social node is never created by the test: it must come from the pipeline.
 */
describe('Async pipeline: user.created -> ms-social (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((id) => admin.delete(`/api/v1/users/${id}`)));
    await app.close();
  });

  it('creates the social user node once the user is signed up', async () => {
    const signUp = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
    const userId = (signUp.body as SignUpResponseDTO).user.id;
    createdUserIds.push(userId);

    await expect(waitForSocialUserNode(admin, userId)).resolves.toBeUndefined();
  });
});

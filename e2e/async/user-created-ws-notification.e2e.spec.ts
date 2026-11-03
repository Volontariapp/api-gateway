import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io-client';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { connectGatewaySocket, waitForSocketEvent } from '../helpers/ws-client.helper.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';

/** UserWebsocketMessagingType.USER_CREATED of @volontariapp/messaging (not a direct dependency). */
const USER_CREATED_WS_EVENT = 'user.created';
const NOTIFICATION_TIMEOUT_MS = 20_000;

interface UserCreatedWsPayload {
  id: string;
  role: string;
}

/**
 * Async pipeline: user.created up to the WebSocket
 *   POST /users -> ms-user (SQL trigger writes event_queue, targets social:user and user:created)
 *   -> outbox-user -> ws-service opens the user.created gather (stream user:created)
 *   -> post-processor-social (Neo4j node, follow-up USER_SOCIAL_CREATED) -> outbox-social
 *   -> ws-service closes the gather (stream ws:user-created-feedback) and emits 'user.created'.
 * ws-service sends it to the new user only if that user is already connected, and broadcasts it
 * to every other socket: an observer connected before the sign-up receives it without racing.
 */
describe('Async pipeline: user.created -> WebSocket notification (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  let observer: Socket | undefined;
  const createdUserIds: string[] = [];

  const signUp = async (): Promise<SignUpResponseDTO> => {
    const res = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
    const body = res.body as SignUpResponseDTO;
    createdUserIds.push(body.user.id);
    return body;
  };

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const observerAccount = await signUp();
    observer = await connectGatewaySocket(observerAccount.auth.accessToken);
  });

  afterAll(async () => {
    observer?.disconnect();
    await Promise.all(createdUserIds.map((id) => admin.delete(`/api/v1/users/${id}`)));
    await app.close();
  });

  it('pushes user.created to connected sockets once the sign-up saga completes', async () => {
    if (!observer) {
      throw new Error('observer socket not connected');
    }
    const connectedObserver = observer;
    // Filled after the sign-up: the listener must be attached before, the pipeline may be fast.
    const newUser: { id?: string } = {};
    const notification = waitForSocketEvent<UserCreatedWsPayload>(
      connectedObserver,
      USER_CREATED_WS_EVENT,
      (payload) => newUser.id !== undefined && payload.id === newUser.id,
      {
        timeoutMs: NOTIFICATION_TIMEOUT_MS,
        description: `'${USER_CREATED_WS_EVENT}' for the new user (user.created gather in ws-service)`,
      },
    );

    newUser.id = (await signUp()).user.id;

    await expect(notification).resolves.toEqual(expect.objectContaining({ id: newUser.id }));
  });
});

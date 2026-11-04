import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io-client';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../../helpers/create-app.helper.js';
import type { TestClient } from '../../helpers/test-client.helper.js';
import { createTestClient } from '../../helpers/test-client.helper.js';
import { connectGatewaySocket } from '../../helpers/ws-client.helper.js';
import { waitForSocialUserNode } from '../../helpers/social-node.helper.js';
import { signUpRequestFactory } from '../../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../../src/modules/user/dto/response/index.js';

/** A real signed-up user: its social node exists (written by the pipeline) when it is returned. */
export interface ScenarioActor {
  readonly id: string;
  /** REST client authenticated as this user with the requested role. */
  readonly client: TestClient;
  /** Access token issued by ms-user at sign-up, used to open a WebSocket through the gateway. */
  readonly accessToken: string;
  readonly email: string;
  readonly password: string;
}

type Cleanup = () => Promise<unknown>;

/**
 * Owns everything a scenario suite creates (users, sockets, extra cleanups) so that every
 * suite closes its own data and nothing leaks into a parallel suite (Jest runs 4 workers).
 */
export class ScenarioWorld {
  private readonly userIds = new Set<string>();
  private readonly sockets: Socket[] = [];
  private readonly cleanups: Cleanup[] = [];

  private constructor(
    readonly app: INestApplication,
    readonly admin: TestClient,
  ) {}

  static async open(): Promise<ScenarioWorld> {
    const app = await createApp();
    const admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    return new ScenarioWorld(app, admin);
  }

  /** Signs up through POST /users and waits for the social node written by user.created. */
  async signUp(role: UserRoles = UserRoles.VOLUNTEER): Promise<ScenarioActor> {
    const dto = signUpRequestFactory();
    const res = await this.admin.post('/api/v1/users').send(dto).expect(201);
    const body = res.body as SignUpResponseDTO;
    const id = body.user.id;
    this.userIds.add(id);

    await waitForSocialUserNode(this.admin, id);

    const client = await createTestClient(this.app).login({ id, role });
    return {
      id,
      client,
      accessToken: body.auth.accessToken,
      email: dto.email,
      password: dto.password,
    };
  }

  /** Signs up `count` users concurrently. */
  signUpMany(count: number, role: UserRoles = UserRoles.VOLUNTEER): Promise<ScenarioActor[]> {
    return Promise.all(Array.from({ length: count }, () => this.signUp(role)));
  }

  /** Opens a WebSocket through the gateway proxy as `actor`; closed by `close()`. */
  async connect(actor: ScenarioActor): Promise<Socket> {
    const socket = await connectGatewaySocket(actor.accessToken);
    this.sockets.push(socket);
    return socket;
  }

  /** Registers a cleanup run by `close()`, before the users are deleted. */
  onClose(cleanup: Cleanup): void {
    this.cleanups.push(cleanup);
  }

  /** Records a user signed up outside `signUp` so that `close()` deletes it. */
  trackUser(id: string): void {
    this.userIds.add(id);
  }

  /** The scenario deletes this user itself: `close()` must not request it again. */
  forgetUser(id: string): void {
    this.userIds.delete(id);
  }

  async close(): Promise<void> {
    for (const socket of this.sockets) {
      socket.disconnect();
    }
    await Promise.allSettled(this.cleanups.reverse().map((cleanup) => cleanup()));
    await Promise.allSettled(
      [...this.userIds].map((id) => this.admin.delete(`/api/v1/users/${id}`)),
    );
    await this.app.close();
  }
}

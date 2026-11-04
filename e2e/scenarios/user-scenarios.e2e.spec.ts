import type { Socket } from 'socket.io-client';
import { eventually } from '../helpers/eventually.helper.js';
import { recordSocketEvents } from '../helpers/ws-client.helper.js';
import { waitForSocialUserNode } from '../helpers/social-node.helper.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/index.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import {
  readSocialIds,
  waitForSocialIdsToExclude,
  waitForSocialUserNodeRemoved,
} from './helpers/social-graph.helper.js';
import { WS_EVENTS } from './helpers/ws-events.js';

interface UserCreatedWsPayload {
  id: string;
}

/** Sign-ups, gather and Neo4j writes chained: above the default 60 s at worst. */
const SCENARIO_TIMEOUT_MS = 120_000;
const CONCURRENT_SIGN_UPS = 3;

/**
 * User domain scenarios (catalogue: e2e/scenarios/README.md).
 *   user.created: POST /users -> ms-user (trigger, event_queue) -> outbox-user -> post-processor-social
 *     (node, USER_SOCIAL_CREATED) -> outbox-social -> ws-service gather -> 'user.created' to sockets.
 *   user.deleted: DELETE /users/me -> ms-user requestDeletion (PENDING_DELETION + event_queue in one
 *     transaction) -> outbox-user fans out to social:user, user:deleted, user:deleted:{post,event,
 *     storage,ranking} -> post-processor-social DETACH DELETE of the node.
 */
describe('Scenarios: user (E2E)', () => {
  let world: ScenarioWorld;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
  });

  afterAll(async () => {
    await world.close();
  });

  describe('sign-up', () => {
    let observer: Socket;

    beforeAll(async () => {
      observer = await world.connect(await world.signUp());
    });

    it(
      'concurrent sign-ups each get their own social node and notify connected users',
      async () => {
        // Ids are only known after the responses: record first, the pipeline may be faster.
        const notifications = recordSocketEvents<UserCreatedWsPayload>(
          observer,
          WS_EVENTS.USER_CREATED,
        );

        const responses = await Promise.all(
          Array.from({ length: CONCURRENT_SIGN_UPS }, () =>
            world.admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201),
          ),
        );
        const newIds = responses.map((res) => (res.body as SignUpResponseDTO).user.id);
        newIds.forEach((id) => {
          world.trackUser(id);
        });
        expect(new Set(newIds).size).toBe(CONCURRENT_SIGN_UPS);

        await Promise.all(newIds.map((id) => waitForSocialUserNode(world.admin, id)));
        try {
          const received = await eventually(
            () => Promise.resolve(notifications.payloads.map((payload) => payload.id)),
            (ids) => newIds.every((id) => ids.includes(id)),
            {
              description: `'user.created' for each of the ${String(CONCURRENT_SIGN_UPS)} sign-ups`,
            },
          );
          // One notification per sign-up: no duplicate for the same user.
          for (const id of newIds) {
            expect(received.filter((receivedId) => receivedId === id)).toHaveLength(1);
          }
        } finally {
          notifications.stop();
        }
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('account deletion (PENDING_DELETION, fan-out of user.deleted)', () => {
    const deleteMyAccount = async (actor: ScenarioActor): Promise<void> => {
      world.forgetUser(actor.id);
      await actor.client.delete('/api/v1/users/me').expect(200);
    };

    it(
      'hides the account at once, refuses its login and removes it from the social graph',
      async () => {
        const [leaving, follower, bystander] = await world.signUpMany(3);
        await follower.client.post(`/api/v1/social/follow/${leaving.id}`).expect(201);
        await bystander.client.post(`/api/v1/social/follow/${follower.id}`).expect(201);
        const followsPath = `/api/v1/social/users/${follower.id}/follows`;
        expect(await readSocialIds(follower.client, followsPath)).toContain(leaving.id);

        await deleteMyAccount(leaving);

        // Synchronous part (ms-user): PENDING_DELETION is hidden and cannot log in.
        await world.admin.get(`/api/v1/users/${leaving.id}`).expect(404);
        await world.admin
          .post('/api/v1/users/login')
          .send({ email: leaving.email, password: leaving.password })
          .expect(404);

        // Asynchronous part (post-processor-social): node and its relations are gone.
        await waitForSocialUserNodeRemoved(world.admin, leaving.id);
        await waitForSocialIdsToExclude(
          follower.client,
          followsPath,
          leaving.id,
          `FOLLOWS link from ${follower.id} to the deleted user ${leaving.id}`,
        );

        // Nothing leaks to the other users: their nodes and relations are untouched.
        await waitForSocialUserNode(world.admin, follower.id);
        expect(
          await readSocialIds(bystander.client, `/api/v1/social/users/${bystander.id}/follows`),
        ).toContain(follower.id);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'is idempotent: a second request is accepted and the account stays deleted',
      async () => {
        const leaving = await world.signUp();

        await deleteMyAccount(leaving);
        await leaving.client.delete('/api/v1/users/me').expect(200);

        await world.admin.get(`/api/v1/users/${leaving.id}`).expect(404);
        await waitForSocialUserNodeRemoved(world.admin, leaving.id);
      },
      SCENARIO_TIMEOUT_MS,
    );

    // System gap G3 (README): outbox-user pushed user.deleted before user.created (CI run
    // 41809453352: rows written 09:47:45.069 / 45.090, stream ids 1793785665158-0 / 1793785665145-0
    // on social:user); post-processor-social purged, then created the node, which stays orphaned.
    // Fixed by the outbox consumer ordering fix (npm-packages): turn it back into `it` then.
    it.failing(
      'ordering: a deletion requested right after the sign-up still ends without social node',
      async () => {
        // user.created and user.deleted share the stream social:user but are read by two consumer
        // groups of post-processor-social: the deletion may be processed before the creation.
        const res = await world.admin
          .post('/api/v1/users')
          .send(signUpRequestFactory())
          .expect(201);
        const userId = (res.body as SignUpResponseDTO).user.id;
        await world.admin.delete(`/api/v1/users/${userId}`).expect(200);
        await world.admin.get(`/api/v1/users/${userId}`).expect(404);

        // Fence: a stream is read in order within a consumer group, so once a later user went
        // through both groups, both events of the first user were processed.
        const fence = await world.signUp();
        world.forgetUser(fence.id);
        await world.admin.delete(`/api/v1/users/${fence.id}`).expect(200);
        await waitForSocialUserNodeRemoved(world.admin, fence.id);

        await waitForSocialUserNodeRemoved(world.admin, userId);
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('needs post-processor-post, post-processor-event, post-processor-storage, outbox-storage, outbox-ws and post-processor-user', () => {
    it.todo(
      "the deleted user's own socket receives 'user.deleted' (isEmitter: true) once the 5 domains acknowledged (USER_DELETION gather)",
    );
    it.todo(
      "the user's posts and events disappear from REST and search after user.deleted (post-processor-post, post-processor-event)",
    );
    it.todo(
      'the users row is physically deleted after user.deletion_successfull (outbox-ws -> post-processor-user finalizeDeletion)',
    );
    it.todo(
      "a domain that fails its purge sends 'user.deletion_failed' to the user and the account stays PENDING_DELETION",
    );
  });

  describe('needs post-processor-user and ms-storage scan workers', () => {
    it.todo(
      "user.badge_awarded: a user who earns a badge receives 'user.badge_awarded' and the badge is listed on GET /users/me",
    );
    it.todo(
      "user.impact_score_credited: participants of a finished event receive 'user.impact_score_credited' once",
    );
    it.todo(
      'user.avatar_replaced: replacing the avatar schedules the purge of the old file (post-processor-storage)',
    );
  });
});

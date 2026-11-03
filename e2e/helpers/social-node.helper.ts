import type { TestClient } from './test-client.helper.js';
import { eventually } from './eventually.helper.js';

interface SocialUserExistsBody {
  exists: boolean;
}

/**
 * Waits for the social graph node of a signed-up user. The node is created by the async
 * pipeline (user.created -> outbox-user -> post-processor-social), never by the test:
 * creating it by hand races with the post-processor and fails with 409 when it wins.
 */
export async function waitForSocialUserNode(admin: TestClient, userId: string): Promise<void> {
  await eventually(
    async () => {
      const res = await admin.get(`/api/v1/social/users/${userId}`).expect(200);
      return res.body as SocialUserExistsBody;
    },
    (body) => body.exists,
    { description: `social node for user ${userId}` },
  );
}

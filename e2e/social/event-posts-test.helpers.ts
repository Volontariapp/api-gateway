import type { TestClient } from '../helpers/test-client.helper.js';
import type { EventWebResponse, IdsListWebResponse } from '@volontariapp/contracts';
import { createEventRequestFactory } from '../event/event-test.factory.js';

// ─── Event helpers ────────────────────────────────────────────────────────────

/**
 * Creates an event in ms-event (via API Gateway) and registers its node
 * in ms-social synchronously (bypasses the async outbox for test determinism).
 */
export async function createEventWithSocialNode(
  adminClient: TestClient,
): Promise<{ eventId: string }> {
  const eventReq = createEventRequestFactory();
  const res = await adminClient.post('/api/v1/events').send(eventReq).expect(201);
  const eventId = (res.body as EventWebResponse).event.id;

  await adminClient.post(`/api/v1/social/events/${eventId}`).expect(201);

  return { eventId };
}

// ─── Cleanup helpers ──────────────────────────────────────────────────────────

export async function cleanupEvent(adminClient: TestClient, eventId: string): Promise<void> {
  await adminClient.delete(`/api/v1/events/${eventId}`);
  await adminClient.delete(`/api/v1/social/events/${eventId}`);
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

export function assertIdsListContains(body: IdsListWebResponse, ...expectedIds: string[]): void {
  expect(body.ids).toBeDefined();
  for (const id of expectedIds) {
    expect(body.ids).toContain(id);
  }
}

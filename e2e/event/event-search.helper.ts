import type { INestApplication } from '@nestjs/common';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventState, EventType } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { signUpRequestFactory } from '../user/user-test.factory.js';
import { createEventRequestFactory } from './event-test.factory.js';

// ─── Types ──────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  client: TestClient;
}

export interface CityGeo {
  readonly lat: number;
  readonly lng: number;
  readonly name: string;
}

// ─── Geo Constants ──────────────────────────────────────────────────

export const PARIS: CityGeo = { lat: 48.8566, lng: 2.3522, name: 'Paris' };
export const LYON: CityGeo = { lat: 45.764, lng: 4.8357, name: 'Lyon' };
export const MARSEILLE: CityGeo = { lat: 43.2965, lng: 5.3698, name: 'Marseille' };

export function areaQuery(city: CityGeo, radiusMeters = 10_000): string {
  return `area[center][latitude]=${String(city.lat)}&area[center][longitude]=${String(city.lng)}&area[radiusMeters]=${String(radiusMeters)}`;
}

// ─── Factories ──────────────────────────────────────────────────────

/**
 * Creates a real user (REST) + its social graph node (admin REST),
 * returns a typed TestUser with an authenticated TestClient.
 */
export async function createUser(app: INestApplication, admin: TestClient): Promise<TestUser> {
  const signUpRes = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
  const userId = (signUpRes.body as { user: { id: string } }).user.id;

  // Create the social graph node (simulates the outbox post-processor)
  await admin.post(`/api/v1/social/users/${userId}`).send({}).expect(201);

  const client = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });
  return { id: userId, client };
}

/**
 * Creates an event via REST, publishes it, sets its GPS coords via the
 * admin update endpoint, and registers its social graph node.
 */
export async function createPublishedEvent(
  admin: TestClient,
  organizerId: string,
  options: { localisationName: string; lat: number; lng: number; type?: EventType },
): Promise<string> {
  const dto = createEventRequestFactory({
    localisationName: options.localisationName,
    type: options.type ?? EventType.EVENT_TYPE_SOCIAL,
  });

  const createRes = await admin.post('/api/v1/events').send(dto).expect(201);
  const eventId = (createRes.body as EventWebResponse).event.id;

  // Publish
  await admin
    .patch(`/api/v1/events/${eventId}/state`)
    .send({ newState: EventState.EVENT_STATE_PUBLISHED })
    .expect(200);

  // Set GPS coordinates
  await admin
    .patch(`/api/v1/events/${eventId}`)
    .send({ latitude: options.lat, longitude: options.lng })
    .expect(200);

  // Register event node in social graph + link organizer
  await admin.post(`/api/v1/social/events/${eventId}`).send({}).expect(201);
  await admin
    .post(`/api/v1/social/users/${organizerId}/events/${eventId}/own`)
    .send({})
    .expect(201);

  return eventId;
}

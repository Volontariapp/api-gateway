import type { INestApplication } from '@nestjs/common';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventState, EventType } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { waitForSocialEventNode, waitForSocialUserNode } from '../helpers/social-node.helper.js';
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

/** Degrees of latitude between two test cities (about 167 km, far above the 10 km search radius). */
const CITY_SPACING_DEGREES = 1.5;
/** Radius covering the three test cities of a suite, and nothing else with overwhelming probability. */
const SUITE_SCOPE_RADIUS_METERS = 400_000;

export interface SuiteGeo {
  readonly paris: CityGeo;
  readonly lyon: CityGeo;
  readonly marseille: CityGeo;
  /** Area query covering the three cities of this suite only. */
  readonly scopeQuery: string;
  /** Area query (1 km radius) around a point where this suite created nothing. */
  readonly emptyZoneQuery: string;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Builds the three test cities around a random base point, so that parallel suites and
 * reused stacks never share events in the same geographic area. Every global assertion
 * (counts, "empty") must go through `scopeQuery` instead of an unfiltered search.
 */
export function createSuiteGeo(): SuiteGeo {
  const baseLat = Number(randomBetween(-50, 50).toFixed(4));
  const baseLng = Number(randomBetween(-170, 170).toFixed(4));
  const paris: CityGeo = { lat: baseLat, lng: baseLng, name: 'Paris' };
  const lyon: CityGeo = { lat: baseLat + CITY_SPACING_DEGREES, lng: baseLng, name: 'Lyon' };
  const marseille: CityGeo = {
    lat: baseLat + 2 * CITY_SPACING_DEGREES,
    lng: baseLng,
    name: 'Marseille',
  };
  const empty: CityGeo = { lat: baseLat + 10, lng: baseLng, name: 'Empty' };
  return {
    paris,
    lyon,
    marseille,
    scopeQuery: areaQuery(lyon, SUITE_SCOPE_RADIUS_METERS),
    emptyZoneQuery: areaQuery(empty, 1_000),
  };
}

export function areaQuery(city: CityGeo, radiusMeters = 10_000): string {
  return `area[center][latitude]=${String(city.lat)}&area[center][longitude]=${String(city.lng)}&area[radiusMeters]=${String(radiusMeters)}`;
}

// ─── Factories ──────────────────────────────────────────────────────

/**
 * Creates a real user (REST), waits for its social graph node (created by the async
 * pipeline), returns a typed TestUser with an authenticated TestClient.
 */
export async function createUser(app: INestApplication, admin: TestClient): Promise<TestUser> {
  const signUpRes = await admin.post('/api/v1/users').send(signUpRequestFactory()).expect(201);
  const userId = (signUpRes.body as { user: { id: string } }).user.id;

  await waitForSocialUserNode(admin, userId);

  const client = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });
  return { id: userId, client };
}

/**
 * Creates an event via REST, publishes it, sets its GPS coords via the
 * admin update endpoint, waits for its social graph node and links it to `organizerId`.
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

  // The event node comes from the pipeline (event.created -> outbox-event ->
  // post-processor-social). Its CREATED link goes to the creator (`admin`, which has no social
  // node), so the link to `organizerId` is still written here.
  await waitForSocialEventNode(admin, eventId);
  await admin
    .post(`/api/v1/social/users/${organizerId}/events/${eventId}/own`)
    .send({})
    .expect(201);

  return eventId;
}

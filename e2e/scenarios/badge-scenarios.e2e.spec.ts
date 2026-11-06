import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io-client';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventState, EventType } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import { eventually } from '../helpers/eventually.helper.js';
import type { SocketEventRecorder } from '../helpers/ws-client.helper.js';
import { recordSocketEvents } from '../helpers/ws-client.helper.js';
import { waitForSocialEventNode, waitForSocialPostNode } from '../helpers/social-node.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { createSuiteGeo } from '../event/event-search.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import { createPost } from '../post/post-test.helpers.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import { ensureSocialPostNode } from './helpers/social-graph.helper.js';
import { WS_EVENTS } from './helpers/ws-events.js';
import type { BadgeAwardedWsPayload, BadgeSlug } from './helpers/badge-journey.helper.js';
import {
  ALL_BADGE_SLUGS,
  BADGE_PROGRESS_PATH,
  EXPECTED_BADGES,
  badgeEntry,
  currentOf,
  notifiedSlugs,
  readBadgeProgress,
  readProfile,
  readProfileBadgeSlugs,
  sumBadgePoints,
  unlockedSlugs,
  waitForBadge,
  waitForUnlocked,
} from './helpers/badge-journey.helper.js';

/** Sign-ups, ten events and eleven posts through the async pipeline, then the badge steps. */
const SETUP_TIMEOUT_MS = 180_000;
const STEP_TIMEOUT_MS = 180_000;

const SOCIAL_EVENT_COUNT = 5;
const ECOLOGY_EVENT_COUNT = 5;
const AUTHOR_POST_COUNT = 10;

/** What the volunteer of the journey ends up with: everything but hosting and the 20 events tier. */
const VOLUNTEER_BADGES: readonly BadgeSlug[] = [
  'COMMUNITY_POST_COUNT_1',
  'SOCIAL_LIKE_COUNT_10',
  'EVENT_WISHLIST_COUNT_10',
  'EVENT_PARTICIPATION_TIER_1',
  'EVENT_PARTICIPATION_TIER_2',
  'EVENT_PARTICIPATION_TIER_3',
  'EVENT_SOCIAL_TIER_1',
  'EVENT_SOCIAL_TIER_2',
  'EVENT_ECOLOGY_TIER_1',
  'EVENT_ECOLOGY_TIER_2',
  'EVENT_HYBRID_ECO_SOCIAL_TIER_1',
];

const sorted = (slugs: readonly string[]): string[] => [...slugs].sort();

/**
 * Badge scenarios (catalogue: e2e/scenarios/README.md).
 *   Event or post -> ms-* (event_queue) -> outbox-* -> Redis streams -> post-processor-user
 *   (BadgeEvaluator: user_badges, badge_progress, badge points, outbox user.badge_awarded)
 *   -> ws-service -> 'user.badge_awarded' to the socket; GET /users/me/badges/progress reads
 *   ms-user. Needs post-processor-user and post-processor-event, with BADGE_POINTS_ENABLED=true
 *   in the stack for the points assertions.
 *
 * Counters are fed in stream order by a single consumer. The "fence" steps rely on that: once a
 * later action of another user is counted, every earlier action of the volunteer was processed,
 * which lets a scenario assert that something was NOT counted without a fixed sleep.
 */
describe('Scenarios: badges (E2E)', () => {
  let world: ScenarioWorld;

  beforeAll(async () => {
    world = await ScenarioWorld.open();
  });

  afterAll(async () => {
    await world.close();
  });

  describe('progress route', () => {
    it('refuses an anonymous request', async () => {
      await createTestClient(world.app).get(BADGE_PROGRESS_PATH).expect(401);
    });

    it(
      'a fresh account sees the 13 badges locked at 0 percent with their points and requirements',
      async () => {
        const newcomer = await world.signUp();

        const entries = await readBadgeProgress(newcomer.client);

        expect(sorted(entries.map((entry) => entry.slug))).toEqual(sorted(ALL_BADGE_SLUGS));
        for (const slug of ALL_BADGE_SLUGS) {
          const entry = badgeEntry(entries, slug);
          const expected = EXPECTED_BADGES[slug];
          expect(entry.unlocked).toBe(false);
          expect(entry.percent).toBe(0);
          expect(entry.awardedAt).toBeUndefined();
          expect(entry.points).toBe(expected.points);
          expect(entry.name).not.toBe('');
          expect(entry.description).not.toBe('');
          expect(
            entry.requirements.map(({ metric, current, target }) => [metric, current, target]),
          ).toEqual(expected.requirements.map(([metric, target]) => [metric, 0, target]));
        }
        expect(await readProfileBadgeSlugs(newcomer.client)).toEqual([]);
      },
      STEP_TIMEOUT_MS,
    );
  });

  // The steps below share their actors and events and must run in this order: each one starts
  // from the state the previous one left. A failing step makes the next ones fail as well.
  describe('journey of a volunteer who earns as many badges as possible', () => {
    const geo = createSuiteGeo();

    let organizer: ScenarioActor;
    let hero: ScenarioActor;
    let author: ScenarioActor;
    let fence: ScenarioActor;
    let heroSocket: Socket;
    let notifications: SocketEventRecorder<BadgeAwardedWsPayload>;

    let socialEventIds: string[];
    let ecologyEventIds: string[];
    let authorPostIds: string[];
    let ghostPostId: string;
    let heroPostId: string;

    let fenceLikeCount = 0;
    let fenceWishCount = 0;

    const allEventIds = (): string[] => [...socialEventIds, ...ecologyEventIds];

    const createPublishedEvent = async (type: EventType): Promise<string> => {
      const res = await organizer.client
        .post('/api/v1/events')
        .send(createEventRequestFactory({ type }))
        .expect(201);
      const eventId = (res.body as EventWebResponse).event.id;
      world.onClose(() => organizer.client.delete(`/api/v1/events/${eventId}`));
      await organizer.client
        .patch(`/api/v1/events/${eventId}/state`)
        .send({ newState: EventState.EVENT_STATE_PUBLISHED })
        .expect(200);
      await organizer.client
        .patch(`/api/v1/events/${eventId}`)
        .send({ latitude: geo.lyon.lat, longitude: geo.lyon.lng })
        .expect(200);
      await waitForSocialEventNode(world.admin, eventId);
      return eventId;
    };

    const finishEvent = (eventId: string) =>
      organizer.client
        .patch(`/api/v1/events/${eventId}/state`)
        .send({ newState: EventState.EVENT_STATE_FINISHED })
        .expect(200);

    const like = (actor: ScenarioActor, postId: string) =>
      actor.client.post(`/api/v1/social/likes/${postId}`).expect(201);
    const unlike = (actor: ScenarioActor, postId: string) =>
      actor.client.delete(`/api/v1/social/likes/${postId}`).expect(200);
    const wish = (actor: ScenarioActor, eventId: string) =>
      actor.client.post(`/api/v1/social/events/${eventId}/wish`).expect(201);
    const unwish = (actor: ScenarioActor, eventId: string) =>
      actor.client.delete(`/api/v1/social/events/${eventId}/wish`).expect(200);
    const participate = (actor: ScenarioActor, eventId: string) =>
      actor.client.post(`/api/v1/social/events/${eventId}/participate`).expect(201);

    /** Another user likes a post: once counted for them, all earlier likes were processed. */
    const fenceLikes = async (): Promise<void> => {
      fenceLikeCount += 1;
      await like(fence, authorPostIds[fenceLikeCount]);
      const expected = fenceLikeCount;
      await waitForBadge(
        fence.client,
        'SOCIAL_LIKE_COUNT_10',
        (entry) => currentOf(entry) === expected,
        `fence like ${String(expected)} counted`,
      );
    };

    /** Same idea for wishes. */
    const fenceWishes = async (): Promise<void> => {
      fenceWishCount += 1;
      await wish(fence, allEventIds()[fenceWishCount]);
      const expected = fenceWishCount;
      await waitForBadge(
        fence.client,
        'EVENT_WISHLIST_COUNT_10',
        (entry) => currentOf(entry) === expected,
        `fence wish ${String(expected)} counted`,
      );
    };

    beforeAll(async () => {
      [organizer, hero, author, fence] = await Promise.all([
        world.signUp(UserRoles.ORGANIZATION),
        world.signUp(),
        world.signUp(),
        world.signUp(),
      ]);

      heroSocket = await world.connect(hero);
      notifications = recordSocketEvents<BadgeAwardedWsPayload>(
        heroSocket,
        WS_EVENTS.USER_BADGE_AWARDED,
      );

      [socialEventIds, ecologyEventIds, authorPostIds] = await Promise.all([
        Promise.all(
          Array.from({ length: SOCIAL_EVENT_COUNT }, () =>
            createPublishedEvent(EventType.EVENT_TYPE_SOCIAL),
          ),
        ),
        Promise.all(
          Array.from({ length: ECOLOGY_EVENT_COUNT }, () =>
            createPublishedEvent(EventType.EVENT_TYPE_ECOLOGY),
          ),
        ),
        Promise.all(
          Array.from({ length: AUTHOR_POST_COUNT }, async () => {
            const { postId } = await createPost(author.client);
            await waitForSocialPostNode(world.admin, postId);
            return postId;
          }),
        ),
      ]);

      // A like needs a social node. This one has no post in ms-post: the author lookup finds nothing.
      ghostPostId = randomUUID();
      await ensureSocialPostNode(world.admin, ghostPostId);
    }, SETUP_TIMEOUT_MS);

    afterAll(() => {
      notifications.stop();
    });

    it(
      'a first post unlocks COMMUNITY_POST_COUNT_1, notified once and listed on the profile',
      async () => {
        const created = await createPost(hero.client);
        heroPostId = created.postId;
        await waitForSocialPostNode(world.admin, heroPostId);

        const entry = await waitForUnlocked(hero.client, 'COMMUNITY_POST_COUNT_1');

        expect(entry).toMatchObject({ unlocked: true, percent: 100, points: 100 });
        expect(Number.isNaN(Date.parse(entry.awardedAt ?? ''))).toBe(false);
        expect(await readProfileBadgeSlugs(hero.client)).toContain('COMMUNITY_POST_COUNT_1');
        const slugs = await eventually(
          () => Promise.resolve(notifiedSlugs(notifications.payloads)),
          (received) => received.includes('COMMUNITY_POST_COUNT_1'),
          { description: "'user.badge_awarded' for COMMUNITY_POST_COUNT_1" },
        );
        expect(slugs.filter((slug) => slug === 'COMMUNITY_POST_COUNT_1')).toHaveLength(1);
      },
      STEP_TIMEOUT_MS,
    );

    it(
      'likes: only distinct likes on posts of others count, and the 10th unlocks the badge',
      async () => {
        // 1. Eight likes on posts of another user: 8 of 10, the badge is still locked.
        for (const postId of authorPostIds.slice(0, 8)) {
          await like(hero, postId);
        }
        const eight = await waitForBadge(
          hero.client,
          'SOCIAL_LIKE_COUNT_10',
          (entry) => currentOf(entry) === 8,
          '8 likes counted',
        );
        expect(eight).toMatchObject({ unlocked: false, percent: 80 });
        expect(eight.awardedAt).toBeUndefined();

        // 2. A like on the volunteer's own post and a like on a post ms-post does not know are
        //    not counted. Likes are read in order: when the 9th real like shows, both were seen.
        await like(hero, heroPostId);
        await like(hero, ghostPostId);
        await like(hero, authorPostIds[8]);
        const nine = await waitForBadge(
          hero.client,
          'SOCIAL_LIKE_COUNT_10',
          (entry) => currentOf(entry) >= 9,
          '9 likes counted',
        );
        expect(currentOf(nine)).toBe(9);
        expect(nine).toMatchObject({ unlocked: false, percent: 90 });

        // 3. Unlike then like again the same post: still the same 9 distinct posts.
        await unlike(hero, authorPostIds[0]);
        await like(hero, authorPostIds[0]);
        await fenceLikes();
        const stillNine = badgeEntry(await readBadgeProgress(hero.client), 'SOCIAL_LIKE_COUNT_10');
        expect(currentOf(stillNine)).toBe(9);
        expect(stillNine.unlocked).toBe(false);

        // 4. The 10th distinct post unlocks it.
        await like(hero, authorPostIds[9]);
        const unlocked = await waitForUnlocked(hero.client, 'SOCIAL_LIKE_COUNT_10');
        expect(unlocked).toMatchObject({ unlocked: true, percent: 100, points: 100 });
        expect(currentOf(unlocked)).toBe(10);
      },
      STEP_TIMEOUT_MS,
    );

    it(
      'wishlist: a wish removed and made again counts once, and the 10th event unlocks the badge',
      async () => {
        const events = allEventIds();

        for (const eventId of events.slice(0, 9)) {
          await wish(hero, eventId);
        }
        const nine = await waitForBadge(
          hero.client,
          'EVENT_WISHLIST_COUNT_10',
          (entry) => currentOf(entry) === 9,
          '9 wishes counted',
        );
        expect(nine).toMatchObject({ unlocked: false, percent: 90 });

        await unwish(hero, events[0]);
        await wish(hero, events[0]);
        await fenceWishes();
        const stillNine = badgeEntry(
          await readBadgeProgress(hero.client),
          'EVENT_WISHLIST_COUNT_10',
        );
        expect(currentOf(stillNine)).toBe(9);
        expect(stillNine.unlocked).toBe(false);

        await wish(hero, events[9]);
        const unlocked = await waitForUnlocked(hero.client, 'EVENT_WISHLIST_COUNT_10');
        expect(unlocked).toMatchObject({ unlocked: true, percent: 100, points: 100 });
      },
      STEP_TIMEOUT_MS,
    );

    it(
      'participation: finished events move the counters step by step up to the hybrid badge',
      async () => {
        await Promise.all(allEventIds().map((eventId) => participate(hero, eventId)));

        // Four social events finished: the first tiers unlock, the next ones are in progress.
        for (const eventId of socialEventIds.slice(0, 4)) {
          await finishEvent(eventId);
        }
        await waitForBadge(
          hero.client,
          'EVENT_PARTICIPATION_TIER_2',
          (entry) => currentOf(entry) === 4,
          '4 finished events counted',
        );
        let entries = await readBadgeProgress(hero.client);
        expect(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_1').unlocked).toBe(true);
        expect(badgeEntry(entries, 'EVENT_SOCIAL_TIER_1').unlocked).toBe(true);
        expect(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_2')).toMatchObject({
          unlocked: false,
          percent: 80,
        });
        expect(badgeEntry(entries, 'EVENT_SOCIAL_TIER_2')).toMatchObject({
          unlocked: false,
          percent: 80,
        });
        expect(badgeEntry(entries, 'EVENT_ECOLOGY_TIER_1')).toMatchObject({
          unlocked: false,
          percent: 0,
        });
        // Hybrid = 4 of 5 social + 0 of 5 ecology = 4 of 10.
        expect(badgeEntry(entries, 'EVENT_HYBRID_ECO_SOCIAL_TIER_1')).toMatchObject({
          unlocked: false,
          percent: 40,
        });
        expect(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_4')).toMatchObject({
          unlocked: false,
          percent: 20,
        });

        // First ecology event: five events in total, and the ecology badge.
        await finishEvent(ecologyEventIds[0]);
        await waitForUnlocked(hero.client, 'EVENT_PARTICIPATION_TIER_2');
        entries = await readBadgeProgress(hero.client);
        expect(badgeEntry(entries, 'EVENT_ECOLOGY_TIER_1').unlocked).toBe(true);
        expect(badgeEntry(entries, 'EVENT_HYBRID_ECO_SOCIAL_TIER_1')).toMatchObject({
          unlocked: false,
          percent: 50,
        });

        // Fifth social event: the social tier 2 unlocks, the hybrid badge is at 6 of 10.
        await finishEvent(socialEventIds[4]);
        await waitForUnlocked(hero.client, 'EVENT_SOCIAL_TIER_2');
        expect(
          badgeEntry(await readBadgeProgress(hero.client), 'EVENT_HYBRID_ECO_SOCIAL_TIER_1'),
        ).toMatchObject({ unlocked: false, percent: 60 });

        // The other four ecology events: ecology tier 2, hybrid and the 10 events tier.
        for (const eventId of ecologyEventIds.slice(1)) {
          await finishEvent(eventId);
        }
        await waitForUnlocked(hero.client, 'EVENT_HYBRID_ECO_SOCIAL_TIER_1');
        await waitForUnlocked(hero.client, 'EVENT_PARTICIPATION_TIER_3');
        entries = await readBadgeProgress(hero.client);
        expect(badgeEntry(entries, 'EVENT_ECOLOGY_TIER_2').unlocked).toBe(true);
        // Ten events finished, twenty needed: the last tier is halfway.
        expect(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_4')).toMatchObject({
          unlocked: false,
          percent: 50,
        });
        expect(currentOf(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_4'))).toBe(10);
      },
      STEP_TIMEOUT_MS,
    );

    it(
      'ends with the expected badges, each notified once with its points, and the profile agrees',
      async () => {
        const entries = await readBadgeProgress(hero.client);
        expect(unlockedSlugs(entries)).toEqual(sorted(VOLUNTEER_BADGES));
        for (const slug of VOLUNTEER_BADGES) {
          const entry = badgeEntry(entries, slug);
          expect(entry.percent).toBe(100);
          expect(entry.points).toBe(EXPECTED_BADGES[slug].points);
          expect(Number.isNaN(Date.parse(entry.awardedAt ?? ''))).toBe(false);
        }
        // Never hosted an event, and only ten of the twenty events.
        expect(badgeEntry(entries, 'EVENT_HOST_COUNT_1')).toMatchObject({
          unlocked: false,
          percent: 0,
        });
        expect(badgeEntry(entries, 'EVENT_PARTICIPATION_TIER_4').unlocked).toBe(false);

        expect(await readProfileBadgeSlugs(hero.client)).toEqual(sorted(VOLUNTEER_BADGES));

        const received = await eventually(
          () => Promise.resolve(notifiedSlugs(notifications.payloads)),
          (slugs) => VOLUNTEER_BADGES.every((slug) => slugs.includes(slug)),
          { description: "'user.badge_awarded' for each of the unlocked badges" },
        );
        // One notification per badge: a badge is never awarded, nor announced, twice.
        for (const slug of VOLUNTEER_BADGES) {
          expect(received.filter((receivedSlug) => receivedSlug === slug)).toHaveLength(1);
        }
        expect(received.filter((slug) => !VOLUNTEER_BADGES.includes(slug as BadgeSlug))).toEqual(
          [],
        );
        for (const payload of notifications.payloads) {
          expect(payload.badges.length).toBeGreaterThan(0);
          for (const badge of payload.badges) {
            expect(badge.points).toBe(EXPECTED_BADGES[badge.slug as BadgeSlug].points);
          }
        }

        // Badge points feed the impact score (event points may come on top of them).
        const profile = await readProfile(hero.client);
        expect(profile?.totalImpactScore ?? 0).toBeGreaterThanOrEqual(
          sumBadgePoints(VOLUNTEER_BADGES),
        );
      },
      STEP_TIMEOUT_MS,
    );

    it(
      'the organizer who created ten events earns the hosting badge once and nothing else',
      async () => {
        const entry = await waitForUnlocked(organizer.client, 'EVENT_HOST_COUNT_1');

        expect(entry).toMatchObject({ unlocked: true, percent: 100, points: 200 });
        expect(unlockedSlugs(await readBadgeProgress(organizer.client))).toEqual([
          'EVENT_HOST_COUNT_1',
        ]);
      },
      STEP_TIMEOUT_MS,
    );
  });
});

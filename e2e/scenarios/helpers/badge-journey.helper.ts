import type { UserWebResponse } from '@volontariapp/contracts';
import { eventually } from '../../helpers/eventually.helper.js';
import type { TestClient } from '../../helpers/test-client.helper.js';

export const BADGE_PROGRESS_PATH = '/api/v1/users/me/badges/progress';

/** Async pipeline budget for one badge (event or post -> post-processor-user -> ms-user). */
export const BADGE_WAIT_MS = 45_000;

type Requirement = readonly [metric: string, target: number];

/**
 * The 13 badges as the product defines them (docs/badges/11): points are the base value x10.
 * Spelled out on purpose instead of imported from @volontariapp/shared: the test must fail if
 * the catalogue is changed by accident.
 */
export const EXPECTED_BADGES = {
  EVENT_PARTICIPATION_TIER_1: { points: 100, requirements: [['EVENTS_FINISHED_TOTAL', 1]] },
  EVENT_PARTICIPATION_TIER_2: { points: 250, requirements: [['EVENTS_FINISHED_TOTAL', 5]] },
  EVENT_PARTICIPATION_TIER_3: { points: 500, requirements: [['EVENTS_FINISHED_TOTAL', 10]] },
  EVENT_PARTICIPATION_TIER_4: { points: 1000, requirements: [['EVENTS_FINISHED_TOTAL', 20]] },
  EVENT_SOCIAL_TIER_1: { points: 150, requirements: [['EVENTS_FINISHED_SOCIAL', 1]] },
  EVENT_SOCIAL_TIER_2: { points: 400, requirements: [['EVENTS_FINISHED_SOCIAL', 5]] },
  EVENT_ECOLOGY_TIER_1: { points: 150, requirements: [['EVENTS_FINISHED_ECOLOGY', 1]] },
  EVENT_ECOLOGY_TIER_2: { points: 400, requirements: [['EVENTS_FINISHED_ECOLOGY', 5]] },
  EVENT_HYBRID_ECO_SOCIAL_TIER_1: {
    points: 600,
    requirements: [
      ['EVENTS_FINISHED_SOCIAL', 5],
      ['EVENTS_FINISHED_ECOLOGY', 5],
    ],
  },
  EVENT_HOST_COUNT_1: { points: 200, requirements: [['EVENTS_CREATED', 1]] },
  COMMUNITY_POST_COUNT_1: { points: 100, requirements: [['POSTS_CREATED', 1]] },
  SOCIAL_LIKE_COUNT_10: { points: 100, requirements: [['SOCIAL_LIKES_GIVEN', 10]] },
  EVENT_WISHLIST_COUNT_10: { points: 100, requirements: [['SOCIAL_WISHES', 10]] },
} as const satisfies Record<string, { points: number; requirements: readonly Requirement[] }>;

export type BadgeSlug = keyof typeof EXPECTED_BADGES;

export const ALL_BADGE_SLUGS = Object.keys(EXPECTED_BADGES) as BadgeSlug[];

export interface BadgeRequirementBody {
  metric: string;
  current: number;
  target: number;
}

/** GET /users/me/badges/progress, as serialized in JSON (dates are ISO strings). */
export interface BadgeProgressBody {
  slug: string;
  name: string;
  description: string;
  points: number;
  unlocked: boolean;
  awardedAt?: string;
  percent: number;
  requirements: BadgeRequirementBody[];
}

/** Payload of the 'user.badge_awarded' socket event (one message per post-processor pass). */
export interface BadgeAwardedWsPayload {
  badges: { slug: string; points?: number }[];
}

export async function readBadgeProgress(client: TestClient): Promise<BadgeProgressBody[]> {
  const res = await client.get(BADGE_PROGRESS_PATH).expect(200);
  return (res.body as { badges: BadgeProgressBody[] }).badges;
}

export function badgeEntry(entries: readonly BadgeProgressBody[], slug: string): BadgeProgressBody {
  const entry = entries.find((candidate) => candidate.slug === slug);
  if (entry === undefined) {
    throw new Error(`badge ${slug} is missing from the progress response`);
  }
  return entry;
}

/** Slugs of the unlocked badges, sorted. */
export function unlockedSlugs(entries: readonly BadgeProgressBody[]): string[] {
  return entries
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.slug)
    .sort();
}

/** Value of the first (or only) requirement counter, capped at its target by ms-user. */
export function currentOf(entry: BadgeProgressBody): number {
  return entry.requirements[0]?.current ?? 0;
}

/** Polls the progress route until `predicate` accepts the entry of `slug`. */
export function waitForBadge(
  client: TestClient,
  slug: BadgeSlug,
  predicate: (entry: BadgeProgressBody) => boolean,
  description: string,
): Promise<BadgeProgressBody> {
  return eventually(async () => badgeEntry(await readBadgeProgress(client), slug), predicate, {
    timeoutMs: BADGE_WAIT_MS,
    description: `${slug}: ${description}`,
  });
}

export function waitForUnlocked(client: TestClient, slug: BadgeSlug): Promise<BadgeProgressBody> {
  return waitForBadge(client, slug, (entry) => entry.unlocked, 'unlocked');
}

export async function readProfile(client: TestClient): Promise<UserWebResponse['user']> {
  const res = await client.get('/api/v1/users/me').expect(200);
  return (res.body as UserWebResponse).user;
}

export async function readProfileBadgeSlugs(client: TestClient): Promise<string[]> {
  const user = await readProfile(client);
  return (user?.badges ?? []).map((badge) => badge.slug).sort();
}

/** Every badge slug notified so far, in reception order. */
export function notifiedSlugs(payloads: readonly BadgeAwardedWsPayload[]): string[] {
  return payloads.flatMap((payload) => payload.badges.map((badge) => badge.slug));
}

export function sumBadgePoints(slugs: readonly BadgeSlug[]): number {
  return slugs.reduce((sum, slug) => sum + EXPECTED_BADGES[slug].points, 0);
}

import type { Badge, BadgeProgress } from '@volontariapp/contracts-nest';

export class BadgeProgressFactory {
  static createBadge(overrides: Partial<Badge> = {}): Badge {
    return {
      id: overrides.id ?? '00000000-0000-4000-8000-000000000001',
      name: overrides.name ?? 'Pilier',
      slug: overrides.slug ?? 'EVENT_PARTICIPATION_TIER_3',
      iconPath: overrides.iconPath,
      description: overrides.description ?? 'Participer a 10 evenements',
      awardedAt: overrides.awardedAt,
      iconFileId: overrides.iconFileId,
      points: overrides.points ?? 500,
    };
  }

  static createLocked(overrides: Partial<BadgeProgress> = {}): BadgeProgress {
    return {
      slug: overrides.slug ?? 'EVENT_PARTICIPATION_TIER_2',
      name: overrides.name ?? 'Engage',
      description: overrides.description ?? 'Participer a 5 evenements',
      points: overrides.points ?? 250,
      unlocked: overrides.unlocked ?? false,
      awardedAt: overrides.awardedAt,
      percent: overrides.percent ?? 60,
      requirements: overrides.requirements ?? [
        { metric: 'EVENTS_FINISHED_TOTAL', current: 3, target: 5 },
      ],
      iconFileId: overrides.iconFileId,
    };
  }

  static createUnlocked(awardedAt: Date, overrides: Partial<BadgeProgress> = {}): BadgeProgress {
    return BadgeProgressFactory.createLocked({
      unlocked: true,
      percent: 100,
      awardedAt: {
        seconds: Math.floor(awardedAt.getTime() / 1000),
        nanos: (awardedAt.getTime() % 1000) * 1_000_000,
      },
      ...overrides,
    });
  }
}

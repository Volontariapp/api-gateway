import type { LeaderboardEntry, LeaderboardScope } from '@volontariapp/contracts-nest';

export class LeaderboardFactory {
  static createEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
    return {
      userId: overrides.userId ?? '00000000-0000-4000-8000-000000000010',
      pseudo: overrides.pseudo ?? 'alice',
      avatarFileId: overrides.avatarFileId,
      points: overrides.points ?? 4050,
      rank: overrides.rank ?? 1,
      distinctions: overrides.distinctions ?? [],
    };
  }

  static createPodiumEntry(
    scope: LeaderboardScope,
    tier: number,
    overrides: Partial<LeaderboardEntry> = {},
  ): LeaderboardEntry {
    return LeaderboardFactory.createEntry({
      rank: tier,
      distinctions: [{ scope, tier }],
      ...overrides,
    });
  }
}

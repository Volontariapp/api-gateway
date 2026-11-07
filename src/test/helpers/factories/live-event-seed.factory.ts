/** Horloge fixe des tests du seed d'evenements en cours. */
export const LIVE_SEED_NOW = new Date('2026-11-07T12:00:00.000Z');

export const LIVE_SEED_NOW_SEC = Math.floor(LIVE_SEED_NOW.getTime() / 1000);

export const createLiveSeedTagMap = (): Map<string, string> =>
  new Map<string, string>([['ecology', 'tag-1']]);

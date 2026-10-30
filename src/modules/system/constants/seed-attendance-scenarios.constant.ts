/**
 * Scenarios de fin de vie des evenements passes du seed, alignes sur le scoring dynamique
 * (docs/scoring) : seuls les presents coches par l'organisateur gagnent des points a FINISHED.
 */
export type AttendanceScenario = 'rewarded' | 'small' | 'no-show' | 'unchecked' | 'cancelled';

export interface AttendanceScenarioShare {
  scenario: AttendanceScenario;
  /** Part des evenements passes, en pourcents. La somme de la table vaut 100. */
  sharePercent: number;
}

/**
 * Table de repartition :
 * - rewarded : au moins 3 presents (60 a 100 % des inscrits), prime du createur versee ;
 * - small : 1 ou 2 presents, pas de prime du createur (seuil de 3) ;
 * - no-show : evenement termine, personne de coche, 0 point ;
 * - unchecked : inscrits mais l'organisateur ne coche jamais, termine sans presence ecrite ;
 * - cancelled : etat CANCELLED, aucun point.
 */
export const ATTENDANCE_SCENARIO_TABLE: readonly AttendanceScenarioShare[] = [
  { scenario: 'rewarded', sharePercent: 70 },
  { scenario: 'small', sharePercent: 12 },
  { scenario: 'no-show', sharePercent: 8 },
  { scenario: 'unchecked', sharePercent: 5 },
  { scenario: 'cancelled', sharePercent: 5 },
];

/** Taille maximale d'une liste d'identifiants par appel SetEventAttendance (MAX_ATTENDANCE_BATCH_SIZE de ms-social). */
export const MAX_ATTENDANCE_BATCH_SIZE = 500;

/** Nombre minimal de presents pour que la prime du createur soit versee. */
export const MIN_REWARDED_ATTENDEES = 3;

/** Pas premier avec 100 : parcourt les 100 emplacements de la table avant de se repeter. */
const SLOT_STRIDE = 37;
const SLOT_COUNT = 100;

/** Choisit le scenario d'un evenement passe a partir de son rang, sans aleatoire. */
export function allocateAttendanceScenario(index: number): AttendanceScenario {
  const slot = (((Math.trunc(index) * SLOT_STRIDE) % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT;
  let upperBound = 0;
  for (const entry of ATTENDANCE_SCENARIO_TABLE) {
    upperBound += entry.sharePercent;
    if (slot < upperBound) {
      return entry.scenario;
    }
  }
  return 'rewarded';
}

/** Nombre de presents a cocher pour un scenario, borne par le nombre d'inscrits. */
export function computePresentCount(
  scenario: AttendanceScenario,
  registeredCount: number,
  index: number,
): number {
  if (registeredCount <= 0) {
    return 0;
  }
  switch (scenario) {
    case 'rewarded': {
      // Taux de presence deterministe entre 60 % et 100 %.
      const ratio = 0.6 + (0.4 * ((Math.abs(index) * 7) % 11)) / 10;
      const wanted = Math.ceil(registeredCount * ratio);
      const floor = Math.min(MIN_REWARDED_ATTENDEES, registeredCount);
      return Math.min(registeredCount, Math.max(floor, wanted));
    }
    case 'small':
      return Math.min(registeredCount, 1 + (Math.abs(index) % 2));
    case 'no-show':
    case 'unchecked':
    case 'cancelled':
      return 0;
  }
}

/** Generateur pseudo-aleatoire deterministe (mulberry32). */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Selectionne `count` presents parmi les inscrits, de facon deterministe pour une graine donnee. */
export function selectPresentUserIds(
  registeredUserIds: readonly string[],
  count: number,
  seed: number,
): string[] {
  const pool = [...registeredUserIds];
  const random = createSeededRandom(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}

/** Decoupe une liste en lots de taille maximale `size`. */
export function chunkIds(
  ids: readonly string[],
  size: number = MAX_ATTENDANCE_BATCH_SIZE,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

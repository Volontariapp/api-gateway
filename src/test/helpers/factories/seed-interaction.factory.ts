import { createInitialSeedStatus } from '../../../modules/system/common/index.js';
import {
  allocateAttendanceScenario,
  type AttendanceScenario,
} from '../../../modules/system/constants/seed-attendance-scenarios.constant.js';

export const SEED_ORGANIZER_ID = 'user-1';

export const createSeedUserIds = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `user-${String(i + 1)}`);

export const createSeedEventIds = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `event-${String(i)}`);

/** Plus petit rang d'evenement passe auquel le scenario est attribue. */
export const findPositionForScenario = (scenario: AttendanceScenario): number => {
  for (let position = 0; position < 1000; position++) {
    if (allocateAttendanceScenario(position) === scenario) {
      return position;
    }
  }
  throw new Error(`Scenario ${scenario} is unreachable`);
};

export const createSeedWorld = (pastCount: number, futureCount: number, capacity: number) => {
  const pastEventIds = createSeedEventIds(pastCount);
  const futureEventIds = Array.from({ length: futureCount }, (_, i) => `future-${String(i)}`);
  const eventOwnerMap = new Map<string, string>();
  const eventCapacityMap = new Map<string, number>();
  for (const id of [...pastEventIds, ...futureEventIds]) {
    eventOwnerMap.set(id, SEED_ORGANIZER_ID);
    eventCapacityMap.set(id, capacity);
  }
  return {
    pastEventIds,
    futureEventIds,
    eventOwnerMap,
    eventCapacityMap,
    eventCategoryMap: new Map<string, string>(),
    status: createInitialSeedStatus(),
  };
};

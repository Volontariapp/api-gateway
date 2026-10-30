import {
  ATTENDANCE_SCENARIO_TABLE,
  MAX_ATTENDANCE_BATCH_SIZE,
  allocateAttendanceScenario,
  chunkIds,
  computePresentCount,
  selectPresentUserIds,
  type AttendanceScenario,
} from '../../../../modules/system/constants/seed-attendance-scenarios.constant.js';
import { jest } from '@jest/globals';
import { createSeedUserIds } from '../../../helpers/factories/seed-interaction.factory.js';

describe('seed attendance scenarios (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const tally = (total: number): Record<AttendanceScenario, number> => {
    const counts: Record<AttendanceScenario, number> = {
      rewarded: 0,
      small: 0,
      'no-show': 0,
      unchecked: 0,
      cancelled: 0,
    };
    for (let i = 0; i < total; i++) {
      counts[allocateAttendanceScenario(i)]++;
    }
    return counts;
  };

  it('has a table summing to 100 percent', () => {
    const sum = ATTENDANCE_SCENARIO_TABLE.reduce((acc, entry) => acc + entry.sharePercent, 0);
    expect(sum).toBe(100);
  });

  it('respects the proportions over 200 events within a tolerance', () => {
    const counts = tally(200);
    for (const entry of ATTENDANCE_SCENARIO_TABLE) {
      const expected = (entry.sharePercent / 100) * 200;
      expect(Math.abs(counts[entry.scenario] - expected)).toBeLessThanOrEqual(4);
    }
  });

  it('makes every scenario reachable', () => {
    const counts = tally(200);
    for (const entry of ATTENDANCE_SCENARIO_TABLE) {
      expect(counts[entry.scenario]).toBeGreaterThan(0);
    }
  });

  it('is deterministic across two calls', () => {
    const first = Array.from({ length: 200 }, (_, i) => allocateAttendanceScenario(i));
    const second = Array.from({ length: 200 }, (_, i) => allocateAttendanceScenario(i));
    expect(second).toEqual(first);
  });

  describe('computePresentCount', () => {
    it('rewarded gives at least 3 present and 60 to 100 percent of registered', () => {
      for (let index = 0; index < 50; index++) {
        const present = computePresentCount('rewarded', 20, index);
        expect(present).toBeGreaterThanOrEqual(12);
        expect(present).toBeLessThanOrEqual(20);
      }
      expect(computePresentCount('rewarded', 5, 0)).toBeGreaterThanOrEqual(3);
    });

    it('rewarded never exceeds the registered count', () => {
      expect(computePresentCount('rewarded', 2, 3)).toBe(2);
    });

    it('small gives 1 or 2 present', () => {
      const values = new Set([0, 1, 2, 3].map((i) => computePresentCount('small', 10, i)));
      expect([...values].sort()).toEqual([1, 2]);
    });

    it('no-show, unchecked and cancelled give nobody', () => {
      expect(computePresentCount('no-show', 10, 1)).toBe(0);
      expect(computePresentCount('unchecked', 10, 1)).toBe(0);
      expect(computePresentCount('cancelled', 10, 1)).toBe(0);
    });

    it('returns 0 when nobody is registered', () => {
      expect(computePresentCount('rewarded', 0, 1)).toBe(0);
    });
  });

  describe('selectPresentUserIds', () => {
    it('is deterministic, unique and a subset of the registered users', () => {
      const registered = createSeedUserIds(30);
      const first = selectPresentUserIds(registered, 12, 7);
      const second = selectPresentUserIds(registered, 12, 7);
      expect(second).toEqual(first);
      expect(new Set(first).size).toBe(12);
      for (const id of first) {
        expect(registered).toContain(id);
      }
    });
  });

  describe('chunkIds', () => {
    it('keeps 500 ids in a single batch', () => {
      const chunks = chunkIds(createSeedUserIds(MAX_ATTENDANCE_BATCH_SIZE));
      expect(chunks.map((c) => c.length)).toEqual([500]);
    });

    it('splits 501 ids in 500 and 1', () => {
      const chunks = chunkIds(createSeedUserIds(MAX_ATTENDANCE_BATCH_SIZE + 1));
      expect(chunks.map((c) => c.length)).toEqual([500, 1]);
    });

    it('returns no batch for an empty list', () => {
      expect(chunkIds([])).toEqual([]);
    });
  });
});

import { BadgeDTO } from '../../../../modules/user/dto/common/badge.dto.js';
import { BadgeProgressDTO } from '../../../../modules/user/dto/common/badge-progress.dto.js';
import { BadgeProgressFactory } from '../../../helpers/factories/badge-progress.factory.js';

describe('Badge DTOs (Unit)', () => {
  describe('BadgeDTO.fromBadge', () => {
    it('should expose the points of the badge', () => {
      const dto = BadgeDTO.fromBadge(BadgeProgressFactory.createBadge({ points: 1000 }));

      expect(dto.points).toBe(1000);
      expect(dto.slug).toBe('EVENT_PARTICIPATION_TIER_3');
    });
  });

  describe('BadgeProgressDTO.fromProgress', () => {
    it('should leave awardedAt undefined for a locked badge', () => {
      const dto = BadgeProgressDTO.fromProgress(BadgeProgressFactory.createLocked());

      expect(dto.unlocked).toBe(false);
      expect(dto.awardedAt).toBeUndefined();
    });

    it('should convert the protobuf timestamp of an unlocked badge to a Date', () => {
      const awardedAt = new Date('2026-11-06T10:00:00.000Z');
      const dto = BadgeProgressDTO.fromProgress(BadgeProgressFactory.createUnlocked(awardedAt));

      expect(dto.awardedAt).toEqual(awardedAt);
      expect(dto.percent).toBe(100);
    });

    it('should copy every requirement with its current and target values', () => {
      const dto = BadgeProgressDTO.fromProgress(
        BadgeProgressFactory.createLocked({
          requirements: [
            { metric: 'EVENTS_FINISHED_SOCIAL', current: 5, target: 5 },
            { metric: 'EVENTS_FINISHED_ECOLOGY', current: 2, target: 5 },
          ],
        }),
      );

      expect(dto.requirements).toEqual([
        { metric: 'EVENTS_FINISHED_SOCIAL', current: 5, target: 5 },
        { metric: 'EVENTS_FINISHED_ECOLOGY', current: 2, target: 5 },
      ]);
    });
  });
});

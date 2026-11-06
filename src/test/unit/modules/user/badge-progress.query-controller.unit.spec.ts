import { jest } from '@jest/globals';
import { of, throwError, firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import type { BadgeServiceClient } from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import { BadgeProgressQueryController } from '../../../../modules/user/controllers/queries/badge/badge-progress.query-controller.js';
import { MockBadgeClientGrpc } from '../../../helpers/mocks/badge-client-grpc.mock.js';
import { BadgeProgressFactory } from '../../../helpers/factories/badge-progress.factory.js';

describe('BadgeProgressQueryController (Unit)', () => {
  let controller: BadgeProgressQueryController;
  let mockBadgeService: jest.Mocked<BadgeServiceClient>;

  beforeEach(() => {
    mockBadgeService = createMock<BadgeServiceClient>();
    controller = new BadgeProgressQueryController(new MockBadgeClientGrpc(mockBadgeService));
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMyBadgeProgress', () => {
    it('should call ms-user with an empty query and the internal metadata, never a user id', async () => {
      const metadata = new Metadata();
      const getProgress = jest
        .spyOn(mockBadgeService, 'getMyBadgeProgress')
        .mockReturnValue(of({ badges: [] }));

      await firstValueFrom(controller.getMyBadgeProgress({ internalMetadata: metadata }));

      expect(getProgress).toHaveBeenCalledTimes(1);
      expect(getProgress).toHaveBeenCalledWith({}, metadata);
    });

    it('should map a locked and an unlocked badge to REST DTOs with Date values', async () => {
      const awardedAt = new Date('2026-11-01T08:30:00.250Z');
      jest.spyOn(mockBadgeService, 'getMyBadgeProgress').mockReturnValue(
        of({
          badges: [
            BadgeProgressFactory.createLocked(),
            BadgeProgressFactory.createUnlocked(awardedAt, {
              slug: 'EVENT_PARTICIPATION_TIER_1',
              points: 100,
            }),
          ],
        }),
      );

      const response = await firstValueFrom(
        controller.getMyBadgeProgress({ internalMetadata: new Metadata() }),
      );

      expect(response.badges).toHaveLength(2);
      const [locked, unlocked] = response.badges;
      expect(locked).toMatchObject({
        slug: 'EVENT_PARTICIPATION_TIER_2',
        points: 250,
        unlocked: false,
        percent: 60,
        awardedAt: undefined,
      });
      expect(locked.requirements).toEqual([
        { metric: 'EVENTS_FINISHED_TOTAL', current: 3, target: 5 },
      ]);
      expect(unlocked).toMatchObject({
        slug: 'EVENT_PARTICIPATION_TIER_1',
        unlocked: true,
        percent: 100,
      });
      expect(unlocked.awardedAt).toEqual(awardedAt);
    });

    it('should propagate an error from ms-user instead of swallowing it', async () => {
      jest
        .spyOn(mockBadgeService, 'getMyBadgeProgress')
        .mockReturnValue(throwError(() => new Error('ms-user unavailable')));

      await expect(
        firstValueFrom(controller.getMyBadgeProgress({ internalMetadata: new Metadata() })),
      ).rejects.toThrow('ms-user unavailable');
    });
  });
});

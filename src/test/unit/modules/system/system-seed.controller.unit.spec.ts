import { jest } from '@jest/globals';
import { SystemSeedController } from '../../../../modules/system/controllers/system-seed.controller.js';
import type { SystemSeedService } from '../../../../modules/system/services/system-seed.service.js';
import { SeedPreset } from '../../../../modules/system/common/index.js';
import { createMock } from '@volontariapp/testing';
import type {
  SeedStatusResponseDTO,
  SeedOptionsDTO,
} from '../../../../modules/system/common/index.js';

describe('SystemSeedController (Unit)', () => {
  let controller: SystemSeedController;
  let mockSeedService: jest.Mocked<SystemSeedService>;

  beforeEach(() => {
    mockSeedService = createMock<SystemSeedService>();
    controller = new SystemSeedController(mockSeedService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('seedDatabase', () => {
    it('should trigger seed on SystemSeedService with options and return response', () => {
      const mockReq = { headers: { 'x-user-id': 'admin-123' } };
      const options: SeedOptionsDTO = {
        preset: SeedPreset.QUICK,
        userCount: 15,
        eventCount: 25,
        postCount: 35,
        seedMedia: false,
        concurrency: 5,
      };

      const expectedResult = {
        message: 'Seeding process started',
        options,
      };

      const seedSpy = jest.spyOn(mockSeedService, 'seed').mockReturnValue(expectedResult);

      const result = controller.seedDatabase(mockReq, options);

      expect(seedSpy).toHaveBeenCalledWith(mockReq, options);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSeedStatus', () => {
    it('should return current seed status from service', () => {
      const mockStatus: SeedStatusResponseDTO = {
        users: { success: 10, failed: 0 },
        events: { success: 20, failed: 0 },
        posts: { success: 30, failed: 0 },
        comments: { success: 40, failed: 0 },
        likes: { success: 50, failed: 0 },
        participations: { success: 60, failed: 0 },
        wishes: { success: 15, failed: 0 },
        follows: { success: 25, failed: 0 },
        media: { success: 20, failed: 0 },
        attendances: { success: 70, failed: 0 },
        finishedEvents: { success: 18, failed: 0 },
        cancelledEvents: { success: 1, failed: 0 },
        durationMs: 4200,
      };

      const getStatusSpy = jest.spyOn(mockSeedService, 'getLastStatus').mockReturnValue(mockStatus);

      const result = controller.getSeedStatus();

      expect(getStatusSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStatus);
    });
  });
});

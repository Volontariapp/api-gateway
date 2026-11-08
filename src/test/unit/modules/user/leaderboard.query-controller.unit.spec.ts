import { jest } from '@jest/globals';
import { of, throwError, firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { LeaderboardScope, type UserServiceClient } from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import { LeaderboardQueryController } from '../../../../modules/user/controllers/queries/user/leaderboard.query-controller.js';
import {
  GetLeaderboardRequestDTO,
  GetMyRankRequestDTO,
} from '../../../../modules/user/dto/request/index.js';
import { MockUserClientGrpc } from '../../../helpers/mocks/user-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { LeaderboardFactory } from '../../../helpers/factories/leaderboard.factory.js';

const AVATAR_FILE_ID = '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13';

describe('LeaderboardQueryController (Unit)', () => {
  let controller: LeaderboardQueryController;
  let mockUserService: jest.Mocked<UserServiceClient>;
  const metadata = new Metadata();

  beforeEach(() => {
    mockUserService = createMock<UserServiceClient>();
    controller = new LeaderboardQueryController(
      new MockUserClientGrpc(mockUserService),
      PublicFileUrlFactory.createService('https://files.example.test'),
    );
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should default to the global scope and the default page size', async () => {
      const getLeaderboard = jest
        .spyOn(mockUserService, 'getLeaderboard')
        .mockReturnValue(of({ entries: [], nextCursor: undefined }));

      await firstValueFrom(
        controller.getLeaderboard(new GetLeaderboardRequestDTO(), { internalMetadata: metadata }),
      );

      expect(getLeaderboard).toHaveBeenCalledWith(
        { scope: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL, cursor: undefined, limit: 20 },
        metadata,
      );
    });

    it('should map the week scope, the cursor and the limit to the gRPC query', async () => {
      const getLeaderboard = jest
        .spyOn(mockUserService, 'getLeaderboard')
        .mockReturnValue(of({ entries: [], nextCursor: undefined }));
      const query = Object.assign(new GetLeaderboardRequestDTO(), {
        scope: 'week',
        cursor: 'abc',
        limit: 50,
      });

      await firstValueFrom(controller.getLeaderboard(query, { internalMetadata: metadata }));

      expect(getLeaderboard).toHaveBeenCalledWith(
        { scope: LeaderboardScope.LEADERBOARD_SCOPE_WEEK, cursor: 'abc', limit: 50 },
        metadata,
      );
    });

    it('should return entries with their podium distinction, avatar url and next cursor', async () => {
      jest.spyOn(mockUserService, 'getLeaderboard').mockReturnValue(
        of({
          entries: [
            LeaderboardFactory.createPodiumEntry(LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL, 1, {
              avatarFileId: AVATAR_FILE_ID,
            }),
            LeaderboardFactory.createEntry({ userId: 'u2', pseudo: 'bob', rank: 4, points: 900 }),
          ],
          nextCursor: 'next',
        }),
      );

      const response = await firstValueFrom(
        controller.getLeaderboard(new GetLeaderboardRequestDTO(), { internalMetadata: metadata }),
      );

      expect(response.nextCursor).toBe('next');
      expect(response.entries).toHaveLength(2);
      const [first, second] = response.entries;
      expect(first.rank).toBe(1);
      expect(first.distinctions).toEqual([
        { scope: LeaderboardScope.LEADERBOARD_SCOPE_GLOBAL, tier: 1 },
      ]);
      expect(first.avatarUrl).toBe(`https://files.example.test/user-avatar/${AVATAR_FILE_ID}.webp`);
      expect(second.distinctions).toEqual([]);
      expect(second.avatarUrl).toBeUndefined();
    });

    it('should propagate an error from ms-user instead of swallowing it', async () => {
      jest
        .spyOn(mockUserService, 'getLeaderboard')
        .mockReturnValue(throwError(() => new Error('ms-user unavailable')));

      await expect(
        firstValueFrom(
          controller.getLeaderboard(new GetLeaderboardRequestDTO(), {
            internalMetadata: metadata,
          }),
        ),
      ).rejects.toThrow('ms-user unavailable');
    });
  });

  describe('getMyRank', () => {
    it('should send only the scope, never a user id', async () => {
      const getMyRank = jest
        .spyOn(mockUserService, 'getMyRank')
        .mockReturnValue(of({ me: undefined, neighbors: [] }));
      const query = Object.assign(new GetMyRankRequestDTO(), {
        scope: 'month',
      });

      await firstValueFrom(controller.getMyRank(query, { internalMetadata: metadata }));

      expect(getMyRank).toHaveBeenCalledWith(
        { scope: LeaderboardScope.LEADERBOARD_SCOPE_MONTH },
        metadata,
      );
    });

    it('should return me and its neighbors, and me undefined when the caller has no rank', async () => {
      jest.spyOn(mockUserService, 'getMyRank').mockReturnValueOnce(
        of({
          me: LeaderboardFactory.createEntry({ rank: 128, points: 1200 }),
          neighbors: [LeaderboardFactory.createEntry({ userId: 'u3', rank: 127, points: 1540 })],
        }),
      );

      const ranked = await firstValueFrom(
        controller.getMyRank(new GetMyRankRequestDTO(), { internalMetadata: metadata }),
      );
      expect(ranked.me?.rank).toBe(128);
      expect(ranked.neighbors.map((n) => n.rank)).toEqual([127]);

      jest
        .spyOn(mockUserService, 'getMyRank')
        .mockReturnValueOnce(of({ me: undefined, neighbors: [] }));
      const unranked = await firstValueFrom(
        controller.getMyRank(new GetMyRankRequestDTO(), { internalMetadata: metadata }),
      );
      expect(unranked.me).toBeUndefined();
      expect(unranked.neighbors).toEqual([]);
    });
  });
});

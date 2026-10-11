import { jest } from '@jest/globals';
import { of, firstValueFrom } from 'rxjs';
import { UserCommandController } from '../../../../modules/user/controllers/commands/user/user.command-controller.js';
import { MockUserClientGrpc } from '../../../helpers/mocks/user-client-grpc.mock.js';
import type { UserServiceClient } from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { AuthUser } from '@volontariapp/auth';
import { Metadata } from '@grpc/grpc-js';

describe('UserCommandController (Unit)', () => {
  let controller: UserCommandController;
  let mockDeleteUser: ReturnType<typeof jest.fn>;
  let mockUserService: jest.Mocked<UserServiceClient>;

  const mockUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'VOLUNTEER',
  };

  beforeEach(() => {
    mockDeleteUser = jest.fn().mockReturnValue(of({}));
    mockUserService = createMock<UserServiceClient>();
    mockUserService.deleteUser = mockDeleteUser as never;

    const mockClient = new MockUserClientGrpc(mockUserService);
    controller = new UserCommandController(mockClient);
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('deleteMe', () => {
    it('should request account deletion and return ActionSuccessResponseDTO', async () => {
      const metadata = new Metadata();
      const mockReq = { internalMetadata: metadata };

      const response$ = controller.deleteMe(mockUser, mockReq);
      const response = await firstValueFrom(response$);

      expect(mockDeleteUser).toHaveBeenCalledWith({}, metadata);
      expect(response).toEqual({
        success: true,
        message: 'Demande de suppression de compte prise en compte',
      });
    });
  });
});

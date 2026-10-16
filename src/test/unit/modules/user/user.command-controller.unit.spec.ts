import { jest } from '@jest/globals';
import { of, firstValueFrom } from 'rxjs';
import { UserCommandController } from '../../../../modules/user/controllers/commands/user/user.command-controller.js';
import { MockUserClientGrpc } from '../../../helpers/mocks/user-client-grpc.mock.js';
import type { UserServiceClient } from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { AuthUser } from '@volontariapp/auth';
import { Metadata } from '@grpc/grpc-js';
import { UpdateUserRequestDTO } from '../../../../modules/user/dto/request/update-user.request.dto.js';
import { UserFactory } from '../../../helpers/factories/user.factory.js';

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

  describe('updateMe', () => {
    it('should relay avatarFileId to ms-user and return the refreshed profile', async () => {
      const avatarFileId = '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13';
      const metadata = new Metadata();
      const updateSpy = jest.spyOn(mockUserService, 'updateUser').mockReturnValue(of({}));
      jest
        .spyOn(mockUserService, 'getUser')
        .mockReturnValue(of({ user: UserFactory.createUser({ id: mockUser.id, avatarFileId }) }));
      const request = Object.assign(new UpdateUserRequestDTO(), { avatarFileId });

      const response = await firstValueFrom(
        controller.updateMe(mockUser, request, { internalMetadata: metadata }),
      );

      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ avatarFileId }), metadata);
      expect(response.user.id).toBe(mockUser.id);
    });
  });
});

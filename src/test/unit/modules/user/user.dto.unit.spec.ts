import { UserDTO, UserPublicDTO } from '../../../../modules/user/dto/common/user.dto.js';
import type { UserAvatarUrlBuilder } from '../../../../modules/user/dto/common/user-avatar-url.builder.js';
import { UserFactory } from '../../../helpers/factories/user.factory.js';

const AVATAR_FILE_ID = '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13';

const avatarUrls: UserAvatarUrlBuilder = {
  forUserAvatar: (avatarFileId) =>
    avatarFileId === undefined ? undefined : `https://cdn.test/user-avatar/${avatarFileId}.webp`,
};

describe('User DTOs avatar exposure (Unit)', () => {
  describe('UserDTO.fromUser', () => {
    it('should expose avatarFileId and the computed avatarUrl', () => {
      const dto = UserDTO.fromUser(
        UserFactory.createUser({ avatarFileId: AVATAR_FILE_ID }),
        avatarUrls,
      );

      expect(dto.avatarFileId).toBe(AVATAR_FILE_ID);
      expect(dto.avatarUrl).toBe(`https://cdn.test/user-avatar/${AVATAR_FILE_ID}.webp`);
    });

    it('should leave both avatar fields undefined when the user has no avatar', () => {
      const dto = UserDTO.fromUser(UserFactory.createUser(), avatarUrls);

      expect(dto.avatarFileId).toBeUndefined();
      expect(dto.avatarUrl).toBeUndefined();
    });
  });

  describe('UserPublicDTO.fromUserPublic', () => {
    it('should expose avatarFileId and the computed avatarUrl', () => {
      const dto = UserPublicDTO.fromUserPublic(
        UserFactory.createUserPublic({ avatarFileId: AVATAR_FILE_ID }),
        avatarUrls,
      );

      expect(dto.avatarFileId).toBe(AVATAR_FILE_ID);
      expect(dto.avatarUrl).toBe(`https://cdn.test/user-avatar/${AVATAR_FILE_ID}.webp`);
    });

    it('should leave both avatar fields undefined when the user has no avatar', () => {
      const dto = UserPublicDTO.fromUserPublic(UserFactory.createUserPublic(), avatarUrls);

      expect(dto.avatarFileId).toBeUndefined();
      expect(dto.avatarUrl).toBeUndefined();
    });
  });
});

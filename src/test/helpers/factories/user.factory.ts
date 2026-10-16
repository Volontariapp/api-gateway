import type { User, UserPublic } from '@volontariapp/contracts-nest';

export class UserFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: overrides.id ?? '123e4567-e89b-12d3-a456-426614174000',
      email: overrides.email ?? 'john.doe@example.com',
      pseudo: overrides.pseudo ?? 'john_doe',
      bio: overrides.bio,
      role: overrides.role ?? 'VOLUNTEER',
      logoPath: overrides.logoPath,
      totalImpactScore: overrides.totalImpactScore ?? 0,
      organisationInfo: overrides.organisationInfo,
      badges: overrides.badges ?? [],
      avatarFileId: overrides.avatarFileId,
    };
  }

  static createUserPublic(overrides: Partial<UserPublic> = {}): UserPublic {
    return {
      id: overrides.id ?? '123e4567-e89b-12d3-a456-426614174000',
      pseudo: overrides.pseudo ?? 'john_doe',
      bio: overrides.bio,
      logoPath: overrides.logoPath,
      totalImpactScore: overrides.totalImpactScore ?? 0,
      organisationInfo: overrides.organisationInfo,
      badges: overrides.badges ?? [],
      avatarFileId: overrides.avatarFileId,
    };
  }
}

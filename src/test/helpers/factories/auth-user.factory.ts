import type { AuthUser } from '@volontariapp/auth';
export const createAuthUserMock = (overrides: Partial<AuthUser> = {}): AuthUser => {
  return {
    id: 'user-123',
    role: 'USER',
    email: 'test@example.com',
    ...overrides,
  } as AuthUser;
};

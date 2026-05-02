import { randomUUID } from 'node:crypto';
import type {
  SignUpRequestDTO,
  LoginRequestDTO,
  CreateBadgeRequestDTO,
  UpdateUserRequestDTO,
} from '../../src/modules/user/dto/request/index.js';

export const signUpRequestFactory = (
  overrides?: Partial<SignUpRequestDTO>,
): SignUpRequestDTO => {
  const dto = {
    email: `user-${randomUUID()}@example.com`,
    pseudo: `user_${randomUUID().slice(0, 8)}`,
    password: 'StrongPassword123!',
    bio: 'Senior developer testing the system.',
    phone: '+33612345678',
    ...overrides,
  };
  return dto as SignUpRequestDTO;
};

export const loginRequestFactory = (
  overrides?: Partial<LoginRequestDTO>,
): LoginRequestDTO => {
  const dto = {
    email: 'test@example.com',
    password: 'StrongPassword123!',
    ...overrides,
  };
  return dto as LoginRequestDTO;
};

export const createBadgeRequestFactory = (
  overrides?: Partial<CreateBadgeRequestDTO>,
): CreateBadgeRequestDTO => {
  const uuid = randomUUID().slice(0, 8);
  const dto = {
    name: `Badge-${uuid}`,
    slug: `badge-${uuid}`,
    description: `Description for badge ${uuid}`,
    iconPath: `/icons/badge-${uuid}.png`,
    ...overrides,
  };
  return dto as CreateBadgeRequestDTO;
};

export const updateUserRequestFactory = (
  overrides?: Partial<UpdateUserRequestDTO>,
): UpdateUserRequestDTO => {
  const dto = {
    bio: 'Updated bio',
    pseudo: `updated_${randomUUID().slice(0, 8)}`,
    ...overrides,
  };
  return dto as UpdateUserRequestDTO;
};

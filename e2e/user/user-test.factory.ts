import { randomUUID } from 'node:crypto';
import {
  SignUpRequestDTO,
  LoginRequestDTO,
  CreateBadgeRequestDTO,
  UpdateUserRequestDTO,
} from '../../src/modules/user/dto/request/index.js';

export const signUpRequestFactory = (overrides?: Partial<SignUpRequestDTO>): SignUpRequestDTO => {
  const dto = new SignUpRequestDTO();
  dto.email = `user-${randomUUID()}@example.com`;
  dto.pseudo = `user_${randomUUID().slice(0, 8)}`;
  dto.password = 'StrongPassword123!';
  dto.bio = 'Senior developer testing the system.';
  dto.phone = '+33612345678';
  Object.assign(dto, overrides);
  return dto;
};

export const loginRequestFactory = (overrides?: Partial<LoginRequestDTO>): LoginRequestDTO => {
  const dto = new LoginRequestDTO();
  dto.email = 'test@example.com';
  dto.password = 'StrongPassword123!';
  Object.assign(dto, overrides);
  return dto;
};

export const createBadgeRequestFactory = (
  overrides?: Partial<CreateBadgeRequestDTO>,
): CreateBadgeRequestDTO => {
  const dto = new CreateBadgeRequestDTO();
  const uuid = randomUUID().slice(0, 8);
  dto.name = `Badge-${uuid}`;
  dto.slug = `badge-${uuid}`;
  dto.description = `Description for badge ${uuid}`;
  dto.iconPath = `/icons/badge-${uuid}.png`;
  Object.assign(dto, overrides);
  return dto;
};

export const updateUserRequestFactory = (
  overrides?: Partial<UpdateUserRequestDTO>,
): UpdateUserRequestDTO => {
  const dto = new UpdateUserRequestDTO();
  dto.bio = 'Updated bio';
  dto.pseudo = `updated_${randomUUID().slice(0, 8)}`;
  Object.assign(dto, overrides);
  return dto;
};

export interface RefreshTokenPayload {
  refreshToken: string;
}

export const refreshTokenRequestFactory = (refreshToken: string): RefreshTokenPayload => ({
  refreshToken,
});

import { jest } from '@jest/globals';
import { createMock } from '@volontariapp/testing';
import type { JwtService } from '@volontariapp/auth';

export const SIGNED_INTERNAL_TOKEN = 'signed-internal-token';

/** JwtService that signs every internal token as `SIGNED_INTERNAL_TOKEN`. */
export function createJwtServiceMock(): jest.Mocked<JwtService> {
  const jwtService = createMock<JwtService>();
  jest.spyOn(jwtService, 'signInternal').mockResolvedValue(SIGNED_INTERNAL_TOKEN);
  return jwtService;
}

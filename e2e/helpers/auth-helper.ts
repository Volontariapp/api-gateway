import type { INestApplication } from '@nestjs/common';
import { JwtService, AccessTokenGuard, AccessTokenMiddleware } from '@volontariapp/auth';
import { Reflector } from '@nestjs/core';

export function setupAuth(app: INestApplication) {
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);

  app.useGlobalGuards(new AccessTokenGuard(jwtService, reflector));
  app.use(new AccessTokenMiddleware().use);
}

export async function getAccessToken(app: INestApplication, user: { id: string; role: string }) {
  const jwtService = app.get(JwtService);
  return await jwtService.signAccessToken(user);
}

export async function getAuthHeader(app: INestApplication, user: { id: string; role: string }) {
  const token = await getAccessToken(app, user);
  return { Authorization: `Bearer ${token}` };
}

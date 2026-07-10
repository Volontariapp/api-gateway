import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupAuth } from './auth-helper.js';

function resolveConfigDir(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  return join(currentFileDir, '../../config');
}

export async function createApp(): Promise<INestApplication> {
  process.env.NODE_ENV = 'test';
  const appConfig = loadConfig(resolveConfigDir(), CustomConfig);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule.register(appConfig)],
  }).compile();

  const app = moduleFixture.createNestApplication({ logger: false });
  // Express 5 defaults to the 'simple' query parser, which doesn't parse
  // bracket notation (e.g. area[center][latitude]=1) into nested objects.
  // Restore the 'extended' (qs) parser that the query DTOs rely on.
  (app.getHttpAdapter().getInstance() as { set: (key: string, value: string) => void }).set(
    'query parser',
    'extended',
  );
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  setupAuth(app);
  await app.init();
  return app;
}

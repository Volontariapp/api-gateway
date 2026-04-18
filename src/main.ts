import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig } from '@volontariapp/config';
import { AppModule } from './app.module.js';
import { setupSwagger } from './common/swagger-setup.js';
import { AppConfigService } from './config/app-config.service.js';
import { Logger } from '@volontariapp/logger';
import { CustomConfig } from './config/base-config.js';

function resolveConfigDirectory(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const repositoryRootDir = join(currentFileDir, '..');
  const rootConfigDir = join(repositoryRootDir, 'config');
  if (existsSync(rootConfigDir)) {
    return rootConfigDir;
  }

  throw new Error(`Config directory not found: ${rootConfigDir}`);
}

async function bootstrap() {
  const appConfig = loadConfig(resolveConfigDirectory(), CustomConfig);
  const logger = new Logger({
    context: 'API-GATEWAY',
    format: appConfig.logger.format,
  });
  const app = await NestFactory.create(AppModule.register(appConfig), {
    logger,
  });
  const configService = app.get(AppConfigService);
  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = configService.config.port;
  await app.listen(port);
  logger.log(
    '=================================== API Gateway ===================================',
  );
  logger.log(
    `DOCUMENTATION (Global): http://localhost:${port.toString()}/docs`,
  );
  logger.log(
    `DOCUMENTATION (Events): http://localhost:${port.toString()}/docs/event`,
  );
  logger.log(
    `DOCUMENTATION (Posts):  http://localhost:${port.toString()}/docs/post`,
  );
  logger.log(
    `DOCUMENTATION (Users):  http://localhost:${port.toString()}/docs/user`,
  );
  logger.log(
    `DOCUMENTATION (Social): http://localhost:${port.toString()}/docs/social`,
  );
  logger.log(
    '=================================== API Gateway ===================================',
  );
}
void bootstrap();

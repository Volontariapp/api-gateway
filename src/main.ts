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
import { NodeEnv } from '@volontariapp/config';
import {
  AccessTokenGuard,
  AccessTokenMiddleware,
  RefreshTokenMiddleware,
  JwtService,
  RolesGuard,
} from '@volontariapp/auth';
import { Reflector } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';

function resolveConfigDirectory(): string {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));
  const searchPaths = [
    join(currentFileDir, '..', 'config'),
    join(currentFileDir, '..', '..', 'config'),
    join(currentFileDir, 'config'),
  ];

  for (const rootConfigDir of searchPaths) {
    if (existsSync(rootConfigDir)) {
      return rootConfigDir;
    }
  }

  throw new Error(`Config directory not found. Checked paths: ${searchPaths.join(', ')}`);
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

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const configService = app.get(AppConfigService);
  app.setGlobalPrefix('api/v1');

  setupSwagger(app);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  // GLOBAL LOGGER MIDDLEWARE FOR DEBUGGING
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug(
      `[GLOBAL LOG] Incoming request: ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`,
    );
    next();
  });

  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new AccessTokenGuard(jwtService, reflector), new RolesGuard(reflector));
  app.use(new AccessTokenMiddleware().use);
  app.use(new RefreshTokenMiddleware().use);
  const port = configService.config.port;
  await app.listen(port);
  logger.log('=================================== API Gateway ===================================');
  logger.log(`DOCUMENTATION (Global): http://localhost:${port.toString()}/docs`);
  logger.log(`DOCUMENTATION (Events): http://localhost:${port.toString()}/docs/event`);
  logger.log(`DOCUMENTATION (Posts):  http://localhost:${port.toString()}/docs/post`);
  logger.log(`DOCUMENTATION (Users):  http://localhost:${port.toString()}/docs/user`);
  logger.log(`DOCUMENTATION (Social): http://localhost:${port.toString()}/docs/social`);
  logger.log(`DOCUMENTATION (Admin Hub):    http://localhost:${port.toString()}/docs/admin`);
  logger.log(`DOCUMENTATION (Admin Users):  http://localhost:${port.toString()}/docs/admin/users`);
  logger.log(`DOCUMENTATION (Admin Events): http://localhost:${port.toString()}/docs/admin/events`);
  logger.log(`DOCUMENTATION (Admin Social): http://localhost:${port.toString()}/docs/admin/social`);
  if (appConfig.nodeEnv !== NodeEnv.PRODUCTION) {
    logger.log(`DOCUMENTATION (Helper): http://localhost:${port.toString()}/docs/helpers`);
  }
  logger.log('=================================== API Gateway ===================================');
}
void bootstrap();

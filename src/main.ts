import './tracing.js';
import 'reflect-metadata';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { NestFactory } from '@nestjs/core';
import { BaseConfig, loadConfig } from '@volontariapp/config';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service.js';

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
  const appConfig = loadConfig(resolveConfigDirectory(), BaseConfig);
  const app = await NestFactory.create(AppModule.register(appConfig));
  const configService = app.get(AppConfigService);
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('VolontariApp API Gateway')
    .setDescription('The main entry point for the VolontariApp microservices')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = configService.config.port;
  await app.listen(port);
  Logger.log(
    '=================================== API Gateway ===================================',
  );
  Logger.log(`SWAGGER: http://localhost:${port.toString()}/api`);
  Logger.log(
    '=================================== API Gateway ===================================',
  );
}
void bootstrap();

import './tracing.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { swaggerConfigs } from './common/swagger-setup.js';
import { SwaggerModule } from '@nestjs/swagger';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from './config/base-config.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ErrorResponseDto } from '@volontariapp/errors-nest';

async function bootstrap() {
  const currentFileDir = dirname(fileURLToPath(import.meta.url));

  const searchPaths = [
    join(currentFileDir, '..', 'config'),
    join(currentFileDir, '..', '..', 'config'),
    join(currentFileDir, 'config'),
  ];
  let configDir = '';
  for (const path of searchPaths) {
    if (existsSync(path)) {
      configDir = path;
      break;
    }
  }

  const appConfig = loadConfig(configDir, CustomConfig);

  console.log('🚀 Bootstrapping NestJS for Swagger export...');
  const app = await NestFactory.create(AppModule.register(appConfig), {
    logger: false,
  });

  const outputDir = join(currentFileDir, '..', '..', 'swagger-static');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const config of swaggerConfigs) {
    try {
      console.log(`📝 Generating [${config.name}] JSON...`);
      const document = SwaggerModule.createDocument(app, config.builder.build(), {
        include: config.modules,
        extraModels: [ErrorResponseDto],
      });

      const jsonPath = join(outputDir, `openapi-${config.name}.json`);
      writeFileSync(jsonPath, JSON.stringify(document, null, 2));
      console.log(`✅ Saved JSON to ${jsonPath}`);
    } catch (err: unknown) {
      console.error(`❌ Failed to process [${config.name}]:`, err);
    }
  }

  await app.close();
  console.log('✨ Swagger export process completed (JSON only)!');
  process.exit(0);
}

bootstrap().catch((err: unknown) => {
  console.error('❌ Fatal error during export:', err);
  process.exit(1);
});

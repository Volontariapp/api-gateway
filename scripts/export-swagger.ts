import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module.js';
import { swaggerConfigs } from '../src/common/swagger-setup.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../src/config/base-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function exportSwagger() {
  const configDir = path.join(__dirname, '../config');
  const appConfig = loadConfig(configDir, CustomConfig);

  console.log('🚀 Bootstrapping NestJS for Swagger export...');
  let app;
  try {
    app = await NestFactory.create(AppModule.register(appConfig), {
      logger: false,
    });
  } catch (err) {
    console.error('❌ Failed to bootstrap application:', err);
    process.exit(1);
  }

  const outputDir = path.join(__dirname, '../swagger-static');
  await fs.mkdir(outputDir, { recursive: true });

  for (const config of swaggerConfigs) {
    try {
      console.log(`📝 Generating [${config.name}] JSON swagger...`);
      const document = SwaggerModule.createDocument(
        app,
        config.builder.build(),
        {
          include: config.modules,
        },
      );

      const jsonOutputPath = path.join(
        outputDir,
        `openapi-${config.name}.json`,
      );
      await fs.writeFile(jsonOutputPath, JSON.stringify(document, null, 2));
      console.log(`✅ Saved JSON to ${jsonOutputPath}`);

      console.log(`📖 Converting [${config.name}] to Markdown...`);
      const mdOutputPath = path.join(outputDir, `openapi-${config.name}.md`);

      const { execSync } = await import('node:child_process');
      execSync(
        `PATH=/usr/local/bin:$PATH npx swagger-markdown -i ${jsonOutputPath} -o ${mdOutputPath}`,
        { shell: true },
      );
      console.log(`✅ Saved Markdown to ${mdOutputPath}`);
    } catch (err) {
      console.error(`❌ Failed to process [${config.name}]:`, err);
    }
  }

  await app.close();
  console.log('✨ Swagger export process completed!');
}

exportSwagger().catch((err) => {
  console.error('❌ Failed to export Swagger:', err);
  process.exit(1);
});

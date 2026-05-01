/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { UserModule } from '../modules/user/user.module.js';
import { PostModule } from '../modules/post/post.module.js';
import { EventModule } from '../modules/event/event.module.js';
import { SocialModule } from '../modules/social/social.module.js';
import { HelperModule } from '../modules/helper/helper.module.js';
import { ErrorResponseDto } from '@volontariapp/errors-nest';

export interface SwaggerConfig {
  path: string;
  name: string;
  builder: DocumentBuilder;
  modules?: Function[];
}

export const swaggerConfigs: SwaggerConfig[] = [
  {
    path: '/docs/event',
    name: 'event',
    builder: new DocumentBuilder()
      .setTitle('📅 Events — Microservice')
      .setDescription(
        'Dedicated documentation for the Events domain. Manage event listing, requirements, and participation.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [EventModule],
  },
  {
    path: '/docs/post',
    name: 'post',
    builder: new DocumentBuilder()
      .setTitle('📝 Posts — Microservice')
      .setDescription(
        'Dedicated documentation for the Posts domain. Manage community posts, updates, and interactions.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [PostModule],
  },
  {
    path: '/docs/user',
    name: 'user',
    builder: new DocumentBuilder()
      .setTitle('👤 Users — Microservice')
      .setDescription(
        'Dedicated documentation for the Users domain. Manage user profiles, authentication context, and roles.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [UserModule],
  },
  {
    path: '/docs/social',
    name: 'social',
    builder: new DocumentBuilder()
      .setTitle('🤝 Social — Microservice')
      .setDescription(
        'Dedicated documentation for the Social domain. manage relationships, publications, interactions, and participation.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [SocialModule],
  },
  {
    path: '/docs/helpers',
    name: 'helpers',
    builder: new DocumentBuilder()
      .setTitle('🛠️ Helpers — Utils')
      .setDescription(
        'Dedicated documentation for Helper utilities. Generate tokens and other testing tools.\n\n' +
          '⚠️ **NOT ACCESSIBLE IN PRODUCTION**\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [HelperModule],
  },
  {
    path: '/docs',
    name: 'global',
    builder: new DocumentBuilder()
      .setTitle('🌐 VolontariApp — API Gateway')
      .setDescription(
        '### Welcome to the VolontariApp Ecosystem Documentation\n\n' +
          'This portal aggregates all endpoints from our microservices. For a more focused view, choose a specific domain below:\n\n' +
          '#### 📌 Service Breakdown:\n' +
          '- [📅 ms-event Documentation](/docs/event)\n' +
          '- [📝 ms-post Documentation](/docs/post)\n' +
          '- [👤 ms-user Documentation](/docs/user)\n' +
          '- [🤝 ms-social Documentation](/docs/social)\n' +
          '- [🛠️ Helpers & Utils](/docs/helpers)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
  },
];

export function setupSwagger(app: INestApplication): void {
  for (const config of swaggerConfigs) {
    const document = SwaggerModule.createDocument(app, config.builder.build(), {
      include: config.modules,
      extraModels: [ErrorResponseDto],
    });
    app.use(
      config.path,
      apiReference({
        theme: 'kepler',
        darkMode: true,
        content: document,
      }),
    );
  }
}

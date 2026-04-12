/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { UserModule } from '../modules/user/user.module.js';
import { PostModule } from '../modules/post/post.module.js';
import { EventModule } from '../modules/event/event.module.js';

export function setupSwagger(app: INestApplication): void {
  const setupDocs = (
    path: string,
    options: DocumentBuilder,
    modules?: Function[],
  ) => {
    const document = SwaggerModule.createDocument(app, options.build(), {
      include: modules,
    });
    app.use(
      path,
      apiReference({
        theme: 'kepler',
        darkMode: true,
        content: document,
      }),
    );
  };

  // 📅 ms-event Specific Documentation
  setupDocs(
    '/docs/event',
    new DocumentBuilder()
      .setTitle('📅 Events — Microservice')
      .setDescription(
        'Dedicated documentation for the Events domain. Manage event listing, requirements, and participation.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0'),
    [EventModule],
  );

  // 📝 ms-post Specific Documentation
  setupDocs(
    '/docs/post',
    new DocumentBuilder()
      .setTitle('📝 Posts — Microservice')
      .setDescription(
        'Dedicated documentation for the Posts domain. Manage community posts, updates, and interactions.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0'),
    [PostModule],
  );

  // 👤 ms-user Specific Documentation
  setupDocs(
    '/docs/user',
    new DocumentBuilder()
      .setTitle('👤 Users — Microservice')
      .setDescription(
        'Dedicated documentation for the Users domain. Manage user profiles, authentication context, and roles.\n\n' +
          '🔙 [Back to Global Hub](/docs)',
      )
      .setVersion('1.0'),
    [UserModule],
  );

  // 🌍 Global API Reference
  setupDocs(
    '/docs',
    new DocumentBuilder()
      .setTitle('🌐 VolontariApp — API Gateway')
      .setDescription(
        '### Welcome to the VolontariApp Ecosystem Documentation\n\n' +
          'This portal aggregates all endpoints from our microservices. For a more focused view, choose a specific domain below:\n\n' +
          '#### 📌 Service Breakdown:\n' +
          '- [📅 ms-event Documentation](/docs/event)\n' +
          '- [📝 ms-post Documentation](/docs/post)\n' +
          '- [👤 ms-user Documentation](/docs/user)',
      )
      .setVersion('1.0'),
  );
}

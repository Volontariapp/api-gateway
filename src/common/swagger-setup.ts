/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
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
    path: '/docs/admin',
    name: 'admin',
    builder: new DocumentBuilder()
      .setTitle('🛡️ Admin Dashboard — VolontariApp')
      .setDescription(
        '### Welcome to the VolontariApp Admin Portal\n\n' +
          '⚠️ **All endpoints in this section require the `ADMIN` role** and a valid **access-token** JWT.\n\n' +
          'Choose a specific admin domain below:\n\n' +
          '#### 🔐 Admin Sections:\n' +
          '- [👤 User & Badge Admin](/docs/admin/users)\n' +
          '- [📅 Events Admin (Tags)](/docs/admin/events)\n' +
          '- [🤝 Social Admin](/docs/admin/social)\n\n' +
          '🔙 [Back to Main Hub](/docs)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
  },
  {
    path: '/docs/admin/users',
    name: 'admin-users',
    builder: new DocumentBuilder()
      .setTitle('👤 User & Badge Admin — Admin API')
      .setDescription(
        'Dedicated administration panel for managing users and badges. All endpoints require `ADMIN` role.\n\n' +
          '**Capabilities:**\n' +
          '- List all users in the system\n' +
          '- Assign and revoke badges to/from users\n' +
          '- Manage impact scores for users\n' +
          '- Create, update, and delete badges\n\n' +
          '🔙 [Back to Admin Hub](/docs/admin)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [UserModule],
  },
  {
    path: '/docs/admin/events',
    name: 'admin-events',
    builder: new DocumentBuilder()
      .setTitle('📅 Events Admin (Tags) — Admin API')
      .setDescription(
        'Dedicated administration panel for managing event tags. All endpoints require `ADMIN` role.\n\n' +
          '**Capabilities:**\n' +
          '- Create and manage event tags\n' +
          '- Update tag properties\n' +
          '- Delete tags from the system\n\n' +
          '🔙 [Back to Admin Hub](/docs/admin)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [EventModule],
  },
  {
    path: '/docs/admin/social',
    name: 'admin-social',
    builder: new DocumentBuilder()
      .setTitle('🤝 Social Admin — Admin API')
      .setDescription(
        'Dedicated administration panel for managing social network relationships. Admin endpoints require `ADMIN` role.\n\n' +
          '**Capabilities:**\n' +
          '- Manage user nodes in the social graph\n' +
          '- Manage post and event ownership relationships\n' +
          '- Manage user participation and wishes\n\n' +
          '🔙 [Back to Admin Hub](/docs/admin)',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
    modules: [SocialModule],
  },
  {
    path: '/docs',
    name: 'global',
    builder: new DocumentBuilder()
      .setTitle('🌐 VolontariApp — API Gateway')
      .setDescription(
        '### Welcome to the VolontariApp Ecosystem Documentation\n\n' +
          'This portal aggregates all endpoints from our microservices. For a more focused view, choose a specific domain below:\n\n' +
          '#### 📌 Public Service Breakdown:\n' +
          '- [📅 ms-event Documentation](/docs/event)\n' +
          '- [📝 ms-post Documentation](/docs/post)\n' +
          '- [👤 ms-user Documentation](/docs/user)\n' +
          '- [🤝 ms-social Documentation](/docs/social)\n' +
          '- [🛠️ Helpers & Utils](/docs/helpers)\n\n' +
          '#### 🔐 Admin Hub:\n' +
          '- [🛡️ Admin Dashboard](/docs/admin) — **Requires ADMIN role**',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refresh-token')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'internal-token'),
  },
];

function filterDocumentByAdminTag(document: OpenAPIObject): OpenAPIObject {
  const filtered = { ...document };

  filtered.paths = Object.fromEntries(
    Object.entries(filtered.paths)
      .map(([p, item]) => {
        const methods = item as Record<string, Record<string, unknown>>;
        const kept = Object.fromEntries(
          Object.entries(methods).filter(([, op]) => {
            const tags = op.tags as string[] | undefined;
            return tags?.some((t) => t.includes('Admin'));
          }),
        );
        return [p, kept] as const;
      })
      .filter(([, m]) => Object.keys(m).length > 0),
  );

  return filtered;
}

export function setupSwagger(app: INestApplication): void {
  for (const config of swaggerConfigs) {
    const document = SwaggerModule.createDocument(app, config.builder.build(), {
      include: config.modules,
      extraModels: [ErrorResponseDto],
    });

    const finalDoc = config.name.startsWith('admin')
      ? filterDocumentByAdminTag(document)
      : document;

    app.use(
      config.path,
      apiReference({
        theme: 'kepler',
        darkMode: true,
        content: finalDoc,
      }),
    );
  }
}

import { Module } from '@nestjs/common';
import { UserAuthController } from './controllers/public/user-auth.controller.js';
import { UserQueryController } from './controllers/queries/user.query-controller.js';
import { UserAdminQueryController } from './controllers/queries/user-admin.query-controller.js';
import { UserCommandController } from './controllers/commands/user.command-controller.js';
import { UserAdminCommandController } from './controllers/commands/user-admin.command-controller.js';
import { BadgeQueryController } from './controllers/queries/badge.query-controller.js';
import { BadgeAdminCommandController } from './controllers/commands/badge-admin.command-controller.js';

@Module({
  controllers: [
    UserAuthController,
    UserQueryController,
    UserAdminQueryController,
    UserCommandController,
    UserAdminCommandController,
    BadgeQueryController,
    BadgeAdminCommandController,
  ],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { EventQueryController } from './controllers/queries/event.query-controller.js';
import { EventCommandController } from './controllers/commands/event.command-controller.js';
import { TagQueryController } from './controllers/queries/tag.query-controller.js';
import { TagAdminCommandController } from './controllers/commands/tag-admin.command-controller.js';

@Module({
  controllers: [
    EventQueryController,
    EventCommandController,
    TagQueryController,
    TagAdminCommandController,
  ],
})
export class EventModule {}

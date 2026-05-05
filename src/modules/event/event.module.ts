import { Module } from '@nestjs/common';
import { EventQueryController } from './controllers/queries/event/event.query-controller.js';
import { EventCommandController } from './controllers/commands/event/event.command-controller.js';
import { TagQueryController } from './controllers/queries/tag/tag.query-controller.js';
import { TagAdminCommandController } from './controllers/commands/tag/tag-admin.command-controller.js';

@Module({
  controllers: [
    EventQueryController,
    EventCommandController,
    TagQueryController,
    TagAdminCommandController,
  ],
})
export class EventModule {}

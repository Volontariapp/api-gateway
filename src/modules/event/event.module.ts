import { Module } from '@nestjs/common';
import { EventCommandController } from './controllers/event.command.controller.js';
import { EventQueryController } from './controllers/event.query.controller.js';
import { TagCommandController } from './controllers/tag.command.controller.js';
import { TagQueryController } from './controllers/tag.query.controller.js';

@Module({
  controllers: [
    EventCommandController,
    EventQueryController,
    TagCommandController,
    TagQueryController,
  ],
})
export class EventModule {}

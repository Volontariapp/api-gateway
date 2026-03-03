import { Module } from '@nestjs/common';
import { EventCommandController } from './controllers/event.command.controller.js';
import { EventQueryController } from './controllers/event.query.controller.js';

@Module({
  controllers: [EventCommandController, EventQueryController],
})
export class EventModule {}

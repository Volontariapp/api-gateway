import { Module } from '@nestjs/common';
import { EventController } from './controllers/event.controller.js';
import { TagController } from './controllers/tag.controller.js';

@Module({
  controllers: [EventController, TagController],
})
export class EventModule {}

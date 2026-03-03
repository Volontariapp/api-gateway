import { Module } from '@nestjs/common';
import { PostCommandController } from './controllers/post.command.controller.js';
import { PostQueryController } from './controllers/post.query.controller.js';

@Module({
  controllers: [PostCommandController, PostQueryController],
})
export class PostModule {}

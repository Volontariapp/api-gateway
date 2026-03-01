import { Module } from '@nestjs/common';
import { PostController } from './post.controller.js';

@Module({
  controllers: [PostController],
})
export class PostModule {}

import { Module } from '@nestjs/common';
import { PostController } from './controllers/post.controller.js';

@Module({
  controllers: [PostController],
})
export class PostModule {}

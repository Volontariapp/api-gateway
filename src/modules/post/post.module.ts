import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module.js';
import { PostCommandController } from './controllers/commands/post/post.command-controller.js';
import { PostQueryController } from './controllers/queries/post/post.query-controller.js';
import { AdminPostCommandController } from './controllers/commands/admin/admin-post.command-controller.js';
import { AdminPostQueryController } from './controllers/queries/admin/admin-post.query-controller.js';

import { CommentCommandController } from './controllers/commands/post/comment.command-controller.js';
import { CommentQueryController } from './controllers/queries/post/comment.query-controller.js';

@Module({
  imports: [EventModule],
  controllers: [
    PostCommandController,
    PostQueryController,
    AdminPostCommandController,
    AdminPostQueryController,
    CommentCommandController,
    CommentQueryController,
  ],
})
export class PostModule {}

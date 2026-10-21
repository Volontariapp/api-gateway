import { Module } from '@nestjs/common';
import { AuthModule } from '@volontariapp/auth';
import { SystemSeedController } from './controllers/system-seed.controller.js';
import { SystemSeedService } from './services/system-seed.service.js';
import { MediaSeedService } from './services/media-seed.service.js';
import { TagSeedService } from './services/tag-seed.service.js';
import { UserSeedService } from './services/user-seed.service.js';
import { EventSeedService } from './services/event-seed.service.js';
import { InteractionSeedService } from './services/interaction-seed.service.js';
import { PostSeedService } from './services/post-seed.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SystemSeedController],
  providers: [
    SystemSeedService,
    MediaSeedService,
    TagSeedService,
    UserSeedService,
    EventSeedService,
    InteractionSeedService,
    PostSeedService,
  ],
  exports: [SystemSeedService],
})
export class SystemModule {}

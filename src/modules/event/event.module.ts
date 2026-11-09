import { Module } from '@nestjs/common';
import { EventQueryController } from './controllers/queries/event/event.query-controller.js';
import { EventCommandController } from './controllers/commands/event/event.command-controller.js';
import { TagQueryController } from './controllers/queries/tag/tag.query-controller.js';
import { TagAdminCommandController } from './controllers/commands/tag/tag-admin.command-controller.js';
import { EventParticipantsService } from './services/event-participants.service.js';
import { EventSocialFilterService } from './services/event-social-filter.service.js';
import { HiddenUsersService } from './services/hidden-users.service.js';
import { EventLookupService } from './services/event-lookup.service.js';

import { CacheStatsModule } from '../../common/cache/cache-stats.module.js';

@Module({
  imports: [CacheStatsModule],
  controllers: [
    EventQueryController,
    EventCommandController,
    TagQueryController,
    TagAdminCommandController,
  ],
  providers: [
    EventParticipantsService,
    EventSocialFilterService,
    HiddenUsersService,
    EventLookupService,
  ],
  exports: [EventParticipantsService, HiddenUsersService, EventLookupService],
})
export class EventModule {}

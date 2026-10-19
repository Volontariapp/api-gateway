import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module.js';
import { RankingQueryController } from './controllers/queries/ranking.query-controller.js';
import { RankingCommandController } from './controllers/commands/ranking.command-controller.js';
import { RankedEventsService } from './services/ranked-events.service.js';
import { RankedFeedService } from './services/ranked-feed.service.js';
import { RankingBlocksService } from './services/ranking-blocks.service.js';

@Module({
  imports: [EventModule],
  controllers: [RankingQueryController, RankingCommandController],
  providers: [RankedEventsService, RankedFeedService, RankingBlocksService],
})
export class RankingModule {}

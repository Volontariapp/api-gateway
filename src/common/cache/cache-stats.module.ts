import { Module } from '@nestjs/common';
import { CacheStatsReporter } from './cache-stats.reporter.js';

@Module({
  providers: [
    { provide: CacheStatsReporter, useFactory: (): CacheStatsReporter => new CacheStatsReporter() },
  ],
  exports: [CacheStatsReporter],
})
export class CacheStatsModule {}

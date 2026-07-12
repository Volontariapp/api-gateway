import { Module } from '@nestjs/common';
import { SystemSeedController } from './controllers/system-seed.controller.js';
import { SystemSeedService } from './services/system-seed.service.js';

@Module({
  controllers: [SystemSeedController],
  providers: [SystemSeedService],
})
export class SystemModule {}

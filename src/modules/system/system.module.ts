import { Module } from '@nestjs/common';
import { SystemSeedController } from './controllers/system-seed.controller.js';
import { SystemSeedService } from './services/system-seed.service.js';
import { AuthModule } from '@volontariapp/auth';

@Module({
  imports: [AuthModule],
  controllers: [SystemSeedController],
  providers: [SystemSeedService],
})
export class SystemModule {}

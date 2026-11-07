import { Module } from '@nestjs/common';
import { AuthModule } from '@volontariapp/auth';
import { LiveSharingController } from './controllers/live-sharing.controller.js';
import { LiveSharingService } from './services/live-sharing.service.js';
import { LiveWsClient } from './services/live-ws.client.js';

@Module({
  imports: [AuthModule],
  controllers: [LiveSharingController],
  providers: [LiveSharingService, LiveWsClient],
})
export class LiveModule {}

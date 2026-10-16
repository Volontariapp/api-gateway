import { Module } from '@nestjs/common';
import { StorageCommandController } from './controllers/commands/storage.command-controller.js';
import { StorageQueryController } from './controllers/queries/storage.query-controller.js';

@Module({
  controllers: [StorageCommandController, StorageQueryController],
})
export class StorageModule {}

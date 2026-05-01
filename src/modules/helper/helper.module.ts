import { Module } from '@nestjs/common';
import { TokenHelperController } from './controllers/token-helper.controller.js';

@Module({
  controllers: [TokenHelperController],
})
export class HelperModule {}

import { Module } from '@nestjs/common';
import { UserCommandController } from './controllers/user.command.controller.js';
import { UserQueryController } from './controllers/user.query.controller.js';
@Module({
  controllers: [UserCommandController, UserQueryController],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { UserCommandController } from './controllers/user.command.controllers.js';
import { UserQueryController } from './controllers/user.query.controllers.js';
@Module({
  controllers: [UserCommandController, UserQueryController],
})
export class UserModule {}

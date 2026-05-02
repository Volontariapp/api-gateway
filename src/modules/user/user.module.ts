import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller.js';
import { BadgeController } from './controllers/badge.controller.js';

@Module({
  controllers: [UserController, BadgeController],
})
export class UserModule {}

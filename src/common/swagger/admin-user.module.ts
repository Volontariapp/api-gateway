import { Module } from '@nestjs/common';
import { GrpcClientModule } from '../../grpc/grpc-client.module.js';
import { UserAdminQueryController } from '../../modules/user/controllers/queries/user/user-admin.query-controller.js';
import { UserAdminCommandController } from '../../modules/user/controllers/commands/user/user-admin.command-controller.js';
import { BadgeAdminCommandController } from '../../modules/user/controllers/commands/badge/badge-admin.command-controller.js';

@Module({
  imports: [GrpcClientModule],
  controllers: [UserAdminQueryController, UserAdminCommandController, BadgeAdminCommandController],
})
export class AdminUserModule {}

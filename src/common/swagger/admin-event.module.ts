import { Module } from '@nestjs/common';
import { GrpcClientModule } from '../../grpc/grpc-client.module.js';
import { TagAdminCommandController } from '../../modules/event/controllers/commands/tag/tag-admin.command-controller.js';

@Module({
  imports: [GrpcClientModule],
  controllers: [TagAdminCommandController],
})
export class AdminEventModule {}

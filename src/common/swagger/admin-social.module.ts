import { Module } from '@nestjs/common';
import { GrpcClientModule } from '../../grpc/grpc-client.module.js';
import { SocialUserCommandController } from '../../modules/social/controllers/commands/social-user.command-controller.js';
import { SocialUserQueryController } from '../../modules/social/controllers/queries/social-user.query-controller.js';
import { PublicationCommandController } from '../../modules/social/controllers/commands/publication.command-controller.js';
import { ParticipationCommandController } from '../../modules/social/controllers/commands/participation.command-controller.js';

@Module({
  imports: [GrpcClientModule],
  controllers: [
    SocialUserCommandController,
    SocialUserQueryController,
    PublicationCommandController,
    ParticipationCommandController,
  ],
})
export class AdminSocialModule {}

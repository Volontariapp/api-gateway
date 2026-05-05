import { Module } from '@nestjs/common';
import { GrpcClientModule } from '../../grpc/grpc-client.module.js';
import { SocialUserAdminCommandController } from '../../modules/social/controllers/commands/user/social-user-admin.command-controller.js';
import { SocialUserAdminQueryController } from '../../modules/social/controllers/queries/user/social-user-admin.query-controller.js';
import { ParticipationAdminCommandController } from '../../modules/social/controllers/commands/participation/participation-admin.command-controller.js';
import { ParticipationAdminQueryController } from '../../modules/social/controllers/queries/participation/participation-admin.query-controller.js';
import { InteractionAdminCommandController } from '../../modules/social/controllers/commands/interaction/interaction-admin.command-controller.js';
import { InteractionAdminQueryController } from '../../modules/social/controllers/queries/interaction/interaction-admin.query-controller.js';
import { PublicationAdminCommandController } from '../../modules/social/controllers/commands/publication/publication-admin.command-controller.js';
import { PublicationAdminQueryController } from '../../modules/social/controllers/queries/publication/publication-admin.query-controller.js';
import { RelationshipAdminCommandController } from '../../modules/social/controllers/commands/relationship/relationship-admin.command-controller.js';
import { RelationshipAdminQueryController } from '../../modules/social/controllers/queries/relationship/relationship-admin.query-controller.js';

@Module({
  imports: [GrpcClientModule],
  controllers: [
    SocialUserAdminCommandController,
    SocialUserAdminQueryController,
    ParticipationAdminCommandController,
    ParticipationAdminQueryController,
    InteractionAdminCommandController,
    InteractionAdminQueryController,
    PublicationAdminCommandController,
    PublicationAdminQueryController,
    RelationshipAdminCommandController,
    RelationshipAdminQueryController,
  ],
})
export class AdminSocialModule {}

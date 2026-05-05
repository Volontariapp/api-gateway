import { Module } from '@nestjs/common';
import { InteractionQueryController } from './controllers/queries/interaction/interaction.query-controller.js';
import { InteractionAdminQueryController } from './controllers/queries/interaction/interaction-admin.query-controller.js';
import { InteractionCommandController } from './controllers/commands/interaction/interaction.command-controller.js';
import { InteractionAdminCommandController } from './controllers/commands/interaction/interaction-admin.command-controller.js';
import { PublicationQueryController } from './controllers/queries/publication/publication.query-controller.js';
import { PublicationAdminQueryController } from './controllers/queries/publication/publication-admin.query-controller.js';
import { PublicationAdminCommandController } from './controllers/commands/publication/publication-admin.command-controller.js';
import { ParticipationQueryController } from './controllers/queries/participation/participation.query-controller.js';
import { ParticipationAdminQueryController } from './controllers/queries/participation/participation-admin.query-controller.js';
import { ParticipationCommandController } from './controllers/commands/participation/participation.command-controller.js';
import { ParticipationAdminCommandController } from './controllers/commands/participation/participation-admin.command-controller.js';
import { RelationshipQueryController } from './controllers/queries/relationship/relationship.query-controller.js';
import { RelationshipAdminQueryController } from './controllers/queries/relationship/relationship-admin.query-controller.js';
import { RelationshipCommandController } from './controllers/commands/relationship/relationship.command-controller.js';
import { RelationshipAdminCommandController } from './controllers/commands/relationship/relationship-admin.command-controller.js';
import { SocialUserAdminQueryController } from './controllers/queries/user/social-user-admin.query-controller.js';
import { SocialUserAdminCommandController } from './controllers/commands/user/social-user-admin.command-controller.js';
import { EventPostLinkController } from './controllers/event-post-link.controller.js';

@Module({
  controllers: [
    InteractionQueryController,
    InteractionAdminQueryController,
    InteractionCommandController,
    InteractionAdminCommandController,
    PublicationQueryController,
    PublicationAdminQueryController,
    PublicationAdminCommandController,
    ParticipationQueryController,
    ParticipationAdminQueryController,
    ParticipationCommandController,
    ParticipationAdminCommandController,
    RelationshipQueryController,
    RelationshipAdminQueryController,
    RelationshipCommandController,
    RelationshipAdminCommandController,
    SocialUserAdminQueryController,
    SocialUserAdminCommandController,
    EventPostLinkController,
  ],
})
export class SocialModule {}

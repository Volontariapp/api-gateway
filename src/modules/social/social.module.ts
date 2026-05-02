import { Module } from '@nestjs/common';
import { InteractionQueryController } from './controllers/queries/interaction.query-controller.js';
import { InteractionCommandController } from './controllers/commands/interaction.command-controller.js';
import { PublicationQueryController } from './controllers/queries/publication.query-controller.js';
import { PublicationCommandController } from './controllers/commands/publication.command-controller.js';
import { ParticipationQueryController } from './controllers/queries/participation.query-controller.js';
import { ParticipationCommandController } from './controllers/commands/participation.command-controller.js';
import { RelationshipQueryController } from './controllers/queries/relationship.query-controller.js';
import { RelationshipCommandController } from './controllers/commands/relationship.command-controller.js';
import { SocialUserQueryController } from './controllers/queries/social-user.query-controller.js';
import { SocialUserCommandController } from './controllers/commands/social-user.command-controller.js';
import { EventPostLinkController } from './controllers/event-post-link.controller.js';

@Module({
  controllers: [
    InteractionQueryController,
    InteractionCommandController,
    PublicationQueryController,
    PublicationCommandController,
    ParticipationQueryController,
    ParticipationCommandController,
    RelationshipQueryController,
    RelationshipCommandController,
    SocialUserQueryController,
    SocialUserCommandController,
    EventPostLinkController,
  ],
})
export class SocialModule {}

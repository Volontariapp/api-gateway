import { Module } from '@nestjs/common';
import { SocialUserController } from './controllers/social-user.controller.js';
import { RelationshipController } from './controllers/relationship.controller.js';
import { PublicationController } from './controllers/publication.controller.js';
import { InteractionController } from './controllers/interaction.controller.js';
import { ParticipationController } from './controllers/participation.controller.js';
import { EventPostLinkController } from './controllers/event-post-link.controller.js';

@Module({
  controllers: [
    SocialUserController,
    RelationshipController,
    PublicationController,
    InteractionController,
    ParticipationController,
    EventPostLinkController,
  ],
})
export class SocialModule {}

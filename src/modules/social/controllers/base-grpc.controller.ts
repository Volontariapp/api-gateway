import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  INTERACTION_COMMAND_SERVICE_NAME,
  InteractionCommandServiceClient,
  INTERACTION_QUERY_SERVICE_NAME,
  InteractionQueryServiceClient,
  PUBLICATION_COMMAND_SERVICE_NAME,
  PublicationCommandServiceClient,
  PUBLICATION_QUERY_SERVICE_NAME,
  PublicationQueryServiceClient,
  PARTICIPATION_COMMAND_SERVICE_NAME,
  ParticipationCommandServiceClient,
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  RelationshipCommandServiceClient,
  RELATIONSHIP_QUERY_SERVICE_NAME,
  RelationshipQueryServiceClient,
  SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
  SocialUserNodeCommandServiceClient,
  SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
  SocialUserNodeQueryServiceClient,
} from '@volontariapp/contracts-nest';

export abstract class BaseInteractionGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<InteractionCommandServiceClient>;
  protected queryService!: WithMetadata<InteractionQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<InteractionCommandServiceClient>(
      INTERACTION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<InteractionQueryServiceClient>(
      INTERACTION_QUERY_SERVICE_NAME,
    );
  }
}

export abstract class BasePublicationGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<PublicationCommandServiceClient>;
  protected queryService!: WithMetadata<PublicationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<PublicationCommandServiceClient>(
      PUBLICATION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<PublicationQueryServiceClient>(
      PUBLICATION_QUERY_SERVICE_NAME,
    );
  }
}

export abstract class BaseParticipationGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<ParticipationCommandServiceClient>;
  protected queryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<ParticipationCommandServiceClient>(
      PARTICIPATION_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }
}

export abstract class BaseRelationshipGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<RelationshipCommandServiceClient>;
  protected queryService!: WithMetadata<RelationshipQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<RelationshipCommandServiceClient>(
      RELATIONSHIP_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<RelationshipQueryServiceClient>(
      RELATIONSHIP_QUERY_SERVICE_NAME,
    );
  }
}

export abstract class BaseSocialUserGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<SocialUserNodeCommandServiceClient>;
  protected queryService!: WithMetadata<SocialUserNodeQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<SocialUserNodeCommandServiceClient>(
      SOCIAL_USER_NODE_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<SocialUserNodeQueryServiceClient>(
      SOCIAL_USER_NODE_QUERY_SERVICE_NAME,
    );
  }
}

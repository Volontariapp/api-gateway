import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EventCommandServiceClient,
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
  TAG_COMMAND_SERVICE_NAME,
  TagCommandServiceClient,
  TAG_QUERY_SERVICE_NAME,
  TagQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';

export abstract class BaseEventGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<EventCommandServiceClient>;
  protected queryService!: WithMetadata<EventQueryServiceClient>;

  constructor(@Inject(EVENT_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<EventCommandServiceClient>(
      EVENT_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<EventQueryServiceClient>(EVENT_QUERY_SERVICE_NAME);
  }
}

export abstract class BaseTagGrpcController implements OnModuleInit {
  protected commandService!: WithMetadata<TagCommandServiceClient>;
  protected queryService!: WithMetadata<TagQueryServiceClient>;

  constructor(@Inject(EVENT_PACKAGE) protected client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<TagCommandServiceClient>(TAG_COMMAND_SERVICE_NAME);
    this.queryService = this.client.getService<TagQueryServiceClient>(TAG_QUERY_SERVICE_NAME);
  }
}

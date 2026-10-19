import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@volontariapp/logger';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import type { EventDTO } from '../dto/common/event.dto.js';

/**
 * Fills `currentParticipants` from ms-social: ms-event does not count participants. A failure
 * leaves the value received from ms-event and is only logged, so a list is never lost for it.
 */
@Injectable()
export class EventParticipantsService implements OnModuleInit {
  private readonly logger = new Logger({ context: EventParticipantsService.name });
  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc) {}

  onModuleInit() {
    this.participationQueryService = this.socialClient.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  async enrich(event: EventDTO, metadata: Metadata): Promise<void> {
    try {
      const participants = await firstValueFrom(
        this.participationQueryService.getEventParticipants(
          { eventId: event.id, pagination: { page: 1, limit: 1 } },
          metadata,
        ),
      );
      // We add +1 because the creator is an implicit participant but not returned by getEventParticipants
      event.currentParticipants = (participants.pagination?.total ?? 0) + 1;
    } catch {
      this.logger.warn(`Failed to enrich participants for event ${event.id}`);
    }
  }

  async enrichAll(events: readonly EventDTO[], metadata: Metadata): Promise<void> {
    await Promise.all(events.map((event) => this.enrich(event, metadata)));
  }
}

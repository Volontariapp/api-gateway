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

/** Plafond de ids par appel countEventParticipants (aligne sur ms-social). */
export const COUNT_BATCH_SIZE = 100;

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
    await this.enrichAll([event], metadata);
  }

  /** Un appel par lot de 100 ids (ids dedoublonnes) au lieu d un appel par evenement. */
  async enrichAll(events: readonly EventDTO[], metadata: Metadata): Promise<void> {
    const ids = [...new Set(events.map((event) => event.id))];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += COUNT_BATCH_SIZE) {
      chunks.push(ids.slice(i, i + COUNT_BATCH_SIZE));
    }
    const counts = new Map<string, number>();
    await Promise.all(
      chunks.map(async (eventIds) => {
        try {
          const response = await firstValueFrom(
            this.participationQueryService.countEventParticipants({ eventIds }, metadata),
          );
          for (const { eventId, participantCount } of response.counts) {
            counts.set(eventId, participantCount);
          }
        } catch {
          this.logger.warn(
            `Failed to count participants for ${String(eventIds.length)} events (first: ${eventIds[0]})`,
          );
        }
      }),
    );
    for (const event of events) {
      const count = counts.get(event.id);
      // +1 : le createur est un participant implicite, non compte par ms-social
      if (count !== undefined) {
        event.currentParticipants = count + 1;
      }
    }
  }
}

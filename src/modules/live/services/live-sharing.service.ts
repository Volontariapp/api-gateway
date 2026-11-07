import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import type { AuthUser } from '@volontariapp/auth';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventQueryServiceClient,
  GrpcDateMapper,
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
  type Event,
} from '@volontariapp/contracts-nest';
import { EVENT_NOT_FOUND, INVALID_PARAMETER } from '@volontariapp/errors-nest';
import { Logger } from '@volontariapp/logger';
import { EVENT_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { fetchAllPages } from '../../../common/pagination/index.js';
import type { LiveRevokeReason } from '../constants/live.constants.js';
import { isGrpcNotFound } from '../helpers/grpc-not-found.helper.js';
import {
  computeGrantExpiry,
  isInsideSharingWindow,
  isShareableState,
} from '../helpers/live-sharing-window.helper.js';
import { LiveWsClient, type LiveGrantDetails } from './live-ws.client.js';

/** The event, once the checks that need only its own data have passed. */
interface ShareableEvent {
  organizerId: string;
  latitude: number;
  longitude: number;
  endAt: Date;
}

type EventCheck = { shareable: ShareableEvent } | { refusal: string };

/**
 * Authorizes or stops the sharing of the position of a participant with the organizer (D9, D13).
 *
 * Security rules of the grant:
 * - organizer, coordinates and dates come from the event read from ms-event, never from the client;
 * - an unknown event and every refusal of authorization give the same error (no existence oracle);
 * - the caller is the only user a grant can be made for.
 */
@Injectable()
export class LiveSharingService implements OnModuleInit {
  private readonly logger = new Logger({ context: LiveSharingService.name });
  private eventQueryService!: WithMetadata<EventQueryServiceClient>;
  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    private readonly wsClient: LiveWsClient,
  ) {}

  onModuleInit() {
    this.eventQueryService =
      this.eventClient.getService<EventQueryServiceClient>(EVENT_QUERY_SERVICE_NAME);
    this.participationQueryService = this.socialClient.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  async grant(caller: AuthUser, eventId: string, metadata: Metadata): Promise<void> {
    const event = await this.loadEvent(eventId, metadata);
    const now = new Date();
    const check =
      event === undefined ? ({ refusal: 'event not found' } as const) : this.checkEvent(event, now);
    if ('refusal' in check) {
      throw this.refuse(caller, eventId, check.refusal);
    }
    const shareable = check.shareable;

    if (shareable.organizerId === caller.id) {
      this.logger.warn(
        `Live sharing refused for event ${eventId} and user ${caller.id}: organizer`,
      );
      throw INVALID_PARAMETER('eventId', 'the organizer has nobody to share a position with');
    }

    if (!(await this.participates(eventId, metadata))) {
      throw this.refuse(caller, eventId, 'not a participant');
    }

    const grant: LiveGrantDetails = {
      eventId,
      organizerId: shareable.organizerId,
      eventLatitude: shareable.latitude,
      eventLongitude: shareable.longitude,
      expiresAt: computeGrantExpiry(shareable.endAt, now).toISOString(),
    };
    await this.wsClient.grant(caller, grant);
    this.logger.log(`Live sharing authorized for event ${eventId} and user ${caller.id}`);
  }

  async revoke(caller: AuthUser, eventId: string, reason: LiveRevokeReason): Promise<void> {
    await this.wsClient.revoke(caller, eventId, reason);
    this.logger.log(`Live sharing stopped for event ${eventId} and user ${caller.id}: ${reason}`);
  }

  /** An event ms-event does not know is a refusal like any other; any other failure is propagated. */
  private async loadEvent(eventId: string, metadata: Metadata): Promise<Event | undefined> {
    try {
      const response = await firstValueFrom(
        this.eventQueryService.getEvent({ id: eventId }, metadata),
      );
      return response.event;
    } catch (error: unknown) {
      if (isGrpcNotFound(error)) {
        return undefined;
      }
      throw error;
    }
  }

  /** State, window and data needed for the grant, or the (logged only) reason it cannot be shared. */
  private checkEvent(event: Event, now: Date): EventCheck {
    const startAt = GrpcDateMapper.toDate(event.startAt);
    const endAt = GrpcDateMapper.toDate(event.endAt);
    const { location, organizerId } = event;
    if (
      startAt === undefined ||
      endAt === undefined ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime()) ||
      location === undefined ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude) ||
      organizerId === undefined ||
      organizerId === ''
    ) {
      return { refusal: 'event without dates, location or organizer' };
    }
    if (!isShareableState(event.state)) {
      return { refusal: 'event state' };
    }
    if (!isInsideSharingWindow(startAt, endAt, now)) {
      return { refusal: 'outside the sharing window' };
    }
    return {
      shareable: { organizerId, latitude: location.latitude, longitude: location.longitude, endAt },
    };
  }

  /** There is no boolean RPC: the caller reads its own participations (04 section 6.2, check 4). */
  private async participates(eventId: string, metadata: Metadata): Promise<boolean> {
    const ids = await fetchAllPages((pagination) =>
      firstValueFrom(
        this.participationQueryService.getUserParticipateEvent({ pagination }, metadata),
      ),
    );
    return ids.includes(eventId);
  }

  /** The single answer to every refusal of authorization. The cause is only logged. */
  private refuse(caller: AuthUser, eventId: string, cause: string) {
    this.logger.warn(`Live sharing refused for event ${eventId} and user ${caller.id}: ${cause}`);
    return EVENT_NOT_FOUND(eventId);
  }
}

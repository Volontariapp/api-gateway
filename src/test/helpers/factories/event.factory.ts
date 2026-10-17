import { EventState, EventType, type Event } from '@volontariapp/contracts-nest';
import type {
  CoverStatusOnWire,
  EventOnWire,
} from '../../../modules/event/dto/common/event.dto.js';
import { CoverStatus } from '@volontariapp/contracts-nest';

export const EVENT_COVER_FILE_ID = '76c5b964-b5a1-43e3-85e2-040683457e56';

export class EventFactory {
  static createEvent(overrides: Partial<Event> = {}): Event {
    return {
      id: overrides.id ?? '123e4567-e89b-12d3-a456-426614174000',
      title: overrides.title ?? 'Maraude du samedi',
      description: overrides.description ?? 'Distribution de repas',
      startAt: overrides.startAt ?? { seconds: 1_790_000_000, nanos: 0 },
      endAt: overrides.endAt ?? { seconds: 1_790_003_600, nanos: 0 },
      location: overrides.location ?? { latitude: 48.8566, longitude: 2.3522 },
      localisationName: overrides.localisationName ?? 'Paris',
      type: overrides.type ?? EventType.EVENT_TYPE_SOCIAL,
      state: overrides.state ?? EventState.EVENT_STATE_PUBLISHED,
      awardedImpactScore: overrides.awardedImpactScore ?? 10,
      maxParticipants: overrides.maxParticipants ?? 50,
      currentParticipants: overrides.currentParticipants ?? 0,
      organizerId: overrides.organizerId ?? '223e4567-e89b-12d3-a456-426614174000',
      tags: overrides.tags ?? [],
      requirements: overrides.requirements ?? [],
      coverFileId: overrides.coverFileId,
      coverStatus: overrides.coverStatus ?? CoverStatus.COVER_STATUS_NONE,
    };
  }

  /** Événement tel que le client gRPC de la gateway le décode : `enums: String`, le statut est un nom. */
  static createWireEvent(status: CoverStatusOnWire, coverFileId?: string): EventOnWire {
    return { ...EventFactory.createEvent({ coverFileId }), coverStatus: status };
  }
}

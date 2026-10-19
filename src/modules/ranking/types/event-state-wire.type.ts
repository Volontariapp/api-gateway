import type { EventState } from '@volontariapp/contracts-nest';
import type { EventDTO } from '../../event/dto/common/event.dto.js';

/** Event state as decoded by the gateway gRPC client (`enums: String`): a number or its name. */
export type EventStateOnWire = EventState | keyof typeof EventState;

/** What the read filters look at, with the state in the form it really arrives in. */
export type EventWindowOnWire = Pick<
  EventDTO,
  'startAt' | 'endAt' | 'maxParticipants' | 'currentParticipants'
> & { state: EventStateOnWire };

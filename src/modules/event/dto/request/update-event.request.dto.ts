import { PartialType, OmitType } from '@nestjs/swagger';
import type { UpdateEventCommand, Event } from '@volontariapp/contracts-nest';
import { GrpcDateMapper } from '@volontariapp/contracts-nest';
import type { UpdateEventRequest } from '@volontariapp/contracts';
import { CreateEventRequestDTO } from './create-event.request.dto.js';
import { INVALID_DATE_PARAMETERS } from '@volontariapp/errors-nest';

export class UpdateEventRequestDTO
  extends PartialType(OmitType(CreateEventRequestDTO, ['toCommand'] as const))
  implements UpdateEventRequest
{
  id!: string;

  toCommand(): UpdateEventCommand {
    const { id, startAt, endAt, ...rest } = this;
    const updateMask = Object.keys(this).filter(
      (k) => k !== 'id' && this[k as keyof this] !== undefined,
    );

    const event: Partial<Event> = { ...rest };

    if (startAt !== undefined) {
      const ts = GrpcDateMapper.toTimestamp(startAt);
      if (!ts) {
        throw INVALID_DATE_PARAMETERS('startAt is invalid');
      }
      event.startAt = ts;
    }

    if (endAt !== undefined) {
      const ts = GrpcDateMapper.toTimestamp(endAt);
      if (!ts) {
        throw INVALID_DATE_PARAMETERS('endAt is invalid');
      }
      event.endAt = ts;
    }

    return {
      id,
      event: event as Event,
      updateMask,
    };
  }
}

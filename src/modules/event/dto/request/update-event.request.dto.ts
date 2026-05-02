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
    const { id, startAt, endAt, tagIds, ...rest } = this;

    const event: Partial<Event> = { ...(rest as unknown as Partial<Event>) };
    const updateMask = (Object.keys(rest) as (keyof typeof rest)[]).filter(
      (k) => this[k] !== undefined,
    ) as string[];

    if (startAt !== undefined) {
      const ts = GrpcDateMapper.toTimestamp(startAt);
      console.log(startAt, endAt);

      if (!ts) {
        throw INVALID_DATE_PARAMETERS('startAt is invalid');
      }
      event.startAt = ts;
      updateMask.push('startAt');
    }

    if (endAt !== undefined) {
      const ts = GrpcDateMapper.toTimestamp(endAt);
      if (!ts) {
        throw INVALID_DATE_PARAMETERS('endAt is invalid');
      }
      event.endAt = ts;
      updateMask.push('endAt');
    }

    if (tagIds !== undefined) {
      event.tags = tagIds.map((tagId) => ({ id: tagId }) as unknown as Event['tags'][number]);
      updateMask.push('tags');
    }
    console.log(event);

    return {
      id,
      event: event as Event,
      updateMask,
    };
  }
}

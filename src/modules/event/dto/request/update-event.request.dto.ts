import { PartialType, OmitType } from '@nestjs/swagger';
import type { UpdateEventCommand, Event } from '@volontariapp/contracts-nest';
import type { UpdateEventRequest } from '@volontariapp/contracts';
import { CreateEventRequestDTO } from './create-event.request.dto.js';

export class UpdateEventRequestDTO
  extends PartialType(OmitType(CreateEventRequestDTO, ['toCommand'] as const))
  implements UpdateEventRequest
{
  id!: string;

  toCommand(): UpdateEventCommand {
    const { id, ...rest } = this;
    const updateMask = Object.keys(rest).filter(
      (key) => rest[key as keyof typeof rest] !== undefined,
    );

    return {
      id,
      event: rest as unknown as Event,
      updateMask,
    };
  }
}

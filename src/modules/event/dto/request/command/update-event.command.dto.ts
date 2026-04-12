import { PartialType, OmitType } from '@nestjs/swagger';
import type { UpdateEventCommand, Event } from '@volontariapp/contracts-nest';
import type { UpdateEventRequest } from '@volontariapp/contracts';
import { CreateEventCommandDTO } from './create-event.command.dto.js';

export class UpdateEventCommandDTO
  extends PartialType(OmitType(CreateEventCommandDTO, ['toCommand'] as const))
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

import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import type { UpdateEventCommand, Event } from '@volontariapp/contracts-nest';
import { GrpcDateMapper } from '@volontariapp/contracts-nest';
import type { UpdateEventRequest } from '@volontariapp/contracts';
import { IsNumber, IsOptional } from 'class-validator';
import { CreateEventRequestDTO } from './create-event.request.dto.js';
import { INVALID_DATE_PARAMETERS } from '@volontariapp/errors-nest';

export class UpdateEventRequestDTO
  extends PartialType(OmitType(CreateEventRequestDTO, ['toCommand'] as const))
  implements UpdateEventRequest
{
  id!: string;

  @ApiProperty({ example: 48.8566, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 2.3522, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  toCommand(): UpdateEventCommand {
    const { id, startAt, endAt, tagIds, latitude, longitude, ...rest } = this;

    const event: Partial<Event> = { ...(rest as unknown as Partial<Event>) };
    const updateMask = (Object.keys(rest) as (keyof typeof rest)[]).filter(
      (k) => this[k] !== undefined,
    ) as string[];

    if (latitude !== undefined && longitude !== undefined) {
      event.location = { latitude, longitude };
      updateMask.push('location');
    }

    if (startAt !== undefined) {
      const ts = GrpcDateMapper.toTimestamp(startAt);

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

    return {
      id,
      event: event as Event,
      updateMask,
    };
  }
}

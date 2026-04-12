import { ApiProperty } from '@nestjs/swagger';
import { Event, EventType, EventState } from '@volontariapp/contracts-nest';
import { PointDTO } from './point.dto.js';
import { TagDTO, RequirementDTO } from './common.dto.js';

export class EventDTO implements Event {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  @ApiProperty({ example: 'Tech Conference 2026' })
  title!: string;

  @ApiProperty({ example: 'A conference about the latest tech trends.' })
  description!: string;

  @ApiProperty({ example: '2026-06-15T09:00:00Z', type: Date })
  startAt!: Date | undefined;

  @ApiProperty({ example: '2026-06-17T18:00:00Z', type: Date })
  endAt!: Date | undefined;

  @ApiProperty({ type: PointDTO })
  location: PointDTO | undefined;

  @ApiProperty({ example: 'Paris, France' })
  localisationName!: string;

  @ApiProperty({ enum: EventType, example: EventType.EVENT_TYPE_ECOLOGY })
  type!: EventType;

  @ApiProperty({ enum: EventState, example: EventState.EVENT_STATE_DRAFT })
  state!: EventState;

  @ApiProperty({ example: 100 })
  awardedImpactScore!: number;

  @ApiProperty({ example: 50 })
  maxParticipants!: number;

  @ApiProperty({ example: 0 })
  currentParticipants!: number;

  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  organizerId!: string;

  @ApiProperty({ type: [TagDTO] })
  tags!: TagDTO[];

  @ApiProperty({ type: [RequirementDTO] })
  requirements!: RequirementDTO[];
}

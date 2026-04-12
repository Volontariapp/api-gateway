import { ApiProperty } from '@nestjs/swagger';
import { CreateEventCommand, EventType } from '@volontariapp/contracts-nest';
import { CreateEventRequest } from '@volontariapp/contracts';
import { PointDTO } from '../../common/point.dto.js';

export class CreateEventCommandDTO implements CreateEventRequest {
  @ApiProperty({ example: 'Tech Conference 2026' })
  title!: string;

  @ApiProperty({ example: 'A conference about the latest tech trends.' })
  description!: string;

  @ApiProperty({ example: '2026-06-15T09:00:00Z', type: Date })
  startAt!: Date;

  @ApiProperty({ example: '2026-06-17T18:00:00Z', type: Date })
  endAt!: Date;

  @ApiProperty({ type: PointDTO })
  location!: PointDTO;

  @ApiProperty({ example: 'Paris, France' })
  localisationName!: string;

  @ApiProperty({ enum: EventType, example: EventType.EVENT_TYPE_SOCIAL })
  type!: EventType;

  @ApiProperty({ example: 100 })
  awardedImpactScore!: number;

  @ApiProperty({ example: 50 })
  maxParticipants!: number;

  @ApiProperty({ example: ['uuid-tag-1'], isArray: true, required: false })
  tagIds!: string[];

  toCommand(): CreateEventCommand {
    return {
      title: this.title,
      description: this.description,
      startAt: this.startAt,
      endAt: this.endAt,
      location: this.location,
      localisationName: this.localisationName,
      type: this.type,
      awardedImpactScore: this.awardedImpactScore,
      maxParticipants: this.maxParticipants,
      tagIds: this.tagIds,
    };
  }
}

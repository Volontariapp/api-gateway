import { ApiProperty } from '@nestjs/swagger';
import {
  CreateEventCommand,
  EventType,
  GrpcDateMapper,
} from '@volontariapp/contracts-nest';
import { CreateEventRequest } from '@volontariapp/contracts';
import { PointDTO } from '../../../../common/dto/common/point.dto.js';
import {
  IsString,
  IsDate,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { INVALID_DATE_PARAMETERS } from '@volontariapp/errors-nest';

export class CreateEventRequestDTO implements CreateEventRequest {
  @ApiProperty({ example: 'Tech Conference 2026' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'A conference about the latest tech trends.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: '2026-06-15T09:00:00Z', type: Date })
  @IsDate()
  @Type(() => Date)
  startAt!: Date;

  @ApiProperty({ example: '2026-06-17T18:00:00Z', type: Date })
  @IsDate()
  @Type(() => Date)
  endAt!: Date;

  @ApiProperty({ type: PointDTO })
  @ValidateNested()
  @Type(() => PointDTO)
  location!: PointDTO;

  @ApiProperty({ example: 'Paris, France' })
  @IsString()
  @IsOptional()
  localisationName!: string;

  @ApiProperty({ enum: EventType, example: EventType.EVENT_TYPE_SOCIAL })
  @IsEnum(EventType)
  type!: EventType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  awardedImpactScore!: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  maxParticipants!: number;

  @ApiProperty({
    example: ['76c5b964-b5a1-4ce3-85e2-040683457e56'],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds!: string[];

  toCommand(): CreateEventCommand {
    const startAt = GrpcDateMapper.toTimestamp(this.startAt);
    const endAt = GrpcDateMapper.toTimestamp(this.endAt);
    if (!startAt || !endAt) {
      throw INVALID_DATE_PARAMETERS('startAt or endAt is invalid');
    }

    return {
      title: this.title,
      description: this.description,
      startAt: {
        nanos: startAt.nanos,
        seconds: startAt.seconds,
      },
      endAt: {
        nanos: endAt.nanos,
        seconds: endAt.seconds,
      },
      location: this.location,
      localisationName: this.localisationName,
      type: this.type,
      awardedImpactScore: this.awardedImpactScore,
      maxParticipants: this.maxParticipants,
      tagIds: this.tagIds,
    };
  }
}

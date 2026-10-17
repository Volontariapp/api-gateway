import { ApiProperty } from '@nestjs/swagger';
import {
  CoverStatus,
  Event,
  EventType,
  EventState,
  GrpcDateMapper,
} from '@volontariapp/contracts-nest';
import type { CoverStatusWeb } from '@volontariapp/contracts';
import { EventDTO as IEventDTO } from '@volontariapp/contracts';
import { TagDTO, RequirementDTO } from './common.dto.js';
import { PointDTO } from '../../../../common/dto/common/point.dto.js';
import type { EventCoverUrlBuilder } from './event-cover-url.builder.js';

export const COVER_STATUSES: readonly CoverStatusWeb[] = ['NONE', 'PENDING', 'READY', 'REJECTED'];

/**
 * Statut tel qu'il arrive du client gRPC. Les types générés le déclarent numérique, mais
 * `getGrpcOptions` charge les protos avec `enums: String` (contracts-nest, grpc.helpers.ts) :
 * à l'exécution c'est le nom ('COVER_STATUS_READY'). Les deux formes sont acceptées.
 */
export type CoverStatusOnWire = CoverStatus | keyof typeof CoverStatus;

/** Événement du client gRPC, avec le statut de sa photo sous la forme réellement reçue. */
export type EventOnWire = Omit<Event, 'coverStatus'> & { coverStatus: CoverStatusOnWire };

/** Un statut inconnu ou non précisé vaut NONE : il n'ouvre jamais le calcul d'une URL. */
export function toCoverStatusWeb(status: CoverStatusOnWire): CoverStatusWeb {
  switch (status) {
    case CoverStatus.COVER_STATUS_PENDING:
    case 'COVER_STATUS_PENDING':
      return 'PENDING';
    case CoverStatus.COVER_STATUS_READY:
    case 'COVER_STATUS_READY':
      return 'READY';
    case CoverStatus.COVER_STATUS_REJECTED:
    case 'COVER_STATUS_REJECTED':
      return 'REJECTED';
    default:
      return 'NONE';
  }
}

export abstract class EventBaseDTO {
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

  @ApiProperty({ example: '123 Rue de la Paix, 75001 Paris, France' })
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
}

export class EventResponseDTO extends EventBaseDTO implements IEventDTO {
  static fromResponse(event: EventOnWire, urls: EventCoverUrlBuilder): EventResponseDTO {
    const dto = new EventResponseDTO();
    Object.assign(dto, {
      ...event,
      startAt: GrpcDateMapper.toDate(event.startAt),
      endAt: GrpcDateMapper.toDate(event.endAt),
    });
    dto.coverStatus = toCoverStatusWeb(event.coverStatus);
    if (dto.coverStatus === 'READY') {
      const coverUrl = urls.forEventCover(event.coverFileId);
      if (coverUrl !== undefined) {
        dto.coverUrl = coverUrl;
      }
    }
    return dto;
  }

  @ApiProperty({ type: PointDTO })
  location: PointDTO | undefined;

  @ApiProperty({ type: [TagDTO] })
  tags!: TagDTO[];

  @ApiProperty({ type: [RequirementDTO] })
  requirements!: RequirementDTO[];

  @ApiProperty({ required: false, example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  coverFileId?: string;

  @ApiProperty({
    enum: COVER_STATUSES,
    example: 'NONE',
    description: 'Processing state of the cover photo. coverUrl is only set when READY',
  })
  coverStatus!: CoverStatusWeb;

  @ApiProperty({
    required: false,
    example: 'https://cdn.example.com/event-cover/76c5b964-b5a1-43e3-85e2-040683457e56.webp',
    description: 'Public URL of the cover photo, only present once coverStatus is READY',
  })
  coverUrl?: string;
}

export class EventRequestDTO extends EventBaseDTO {
  @ApiProperty({
    example: ['76c5b964-b5a1-43e3-85e2-040683457e56'],
    isArray: true,
  })
  tagIds!: string[];
}

export { EventResponseDTO as EventDTO };

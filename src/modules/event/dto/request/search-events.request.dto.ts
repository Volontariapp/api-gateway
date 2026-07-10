import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsQuery, EventType, EventState } from '@volontariapp/contracts-nest';
import { SearchEventsRequest } from '@volontariapp/contracts';
import { Transform } from 'class-transformer';
import { GeoCircleDTO } from '../../../../common/dto/common/geo-circle.dto.js';

export class SearchEventsRequestDTO implements SearchEventsRequest {
  @ApiProperty({ type: GeoCircleDTO, required: false })
  area: GeoCircleDTO | undefined;

  @ApiProperty({ enum: EventType, isArray: true, required: false })
  types!: EventType[];

  @ApiProperty({ example: ['tech'], isArray: true, required: false })
  tagSlugs!: string[];

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true' || value === true || value === '1';
  })
  onlyAvailable!: boolean;

  @ApiProperty({ example: 'Tech Conference', required: false })
  searchTerm!: string;

  @ApiProperty({
    example: '76c5b964-b5a1-43e3-85e2-040683457e56',
    required: false,
  })
  organizerId!: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
  startDateFrom?: string;

  @ApiProperty({ example: '2023-12-31T23:59:59Z', required: false })
  startDateTo?: string;

  @ApiProperty({ enum: EventState, isArray: true, required: false })
  statuses?: EventState[];

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  excludeCreatedByMe?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  excludeBlockedUsers?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  excludeParticipatedByMe?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  excludeWishedByMe?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  onlyParticipatedByFriends?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  onlyWishedByFriends?: boolean;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  onlyCreatedByFriends?: boolean;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @Transform(({ value }) => parseInt(String(value), 10) || 1)
  page!: number;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @Transform(({ value }) => parseInt(String(value), 10) || 10)
  limit!: number;

  toQuery(): SearchEventsQuery {
    return {
      area: this.area,
      types: this.types,
      tagSlugs: this.tagSlugs,
      onlyAvailable: this.onlyAvailable,
      searchTerm: this.searchTerm,
      organizerId: this.organizerId,
      startDateFrom: this.startDateFrom,
      startDateTo: this.startDateTo,
      statuses: this.statuses ?? [],
      ids: [],
      excludedIds: [],
      pagination: {
        page: this.page || 1,
        limit: this.limit || 10,
      },
    };
  }
}

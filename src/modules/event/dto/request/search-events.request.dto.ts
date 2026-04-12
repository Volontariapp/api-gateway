import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsQuery, EventType } from '@volontariapp/contracts-nest';
import { SearchEventsRequest } from '@volontariapp/contracts';
import { GeoCircleRequestDTO } from './geo-circle.request.dto.js';

export class SearchEventsRequestDTO implements SearchEventsRequest {
  @ApiProperty({ type: GeoCircleRequestDTO, required: false })
  area: GeoCircleRequestDTO | undefined;

  @ApiProperty({ enum: EventType, isArray: true, required: false })
  types!: EventType[];

  @ApiProperty({ example: ['tech'], isArray: true, required: false })
  tagSlugs!: string[];

  @ApiProperty({ example: true, required: false })
  onlyAvailable!: boolean;

  @ApiProperty({ example: 'Tech Conference', required: false })
  searchTerm!: string;

  @ApiProperty({
    example: '76c5b964-b5a1-43e3-85e2-040683457e56',
    required: false,
  })
  organizerId!: string;

  toQuery(): SearchEventsQuery {
    return {
      area: this.area,
      types: this.types,
      tagSlugs: this.tagSlugs,
      onlyAvailable: this.onlyAvailable,
      searchTerm: this.searchTerm,
      organizerId: this.organizerId,
    };
  }
}

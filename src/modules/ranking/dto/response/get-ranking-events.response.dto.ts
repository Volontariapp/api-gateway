import { ApiProperty } from '@nestjs/swagger';
import type { GetRankingEventsWebResponse } from '@volontariapp/contracts';
import { RankedEventDTO } from '../common/ranked-event.dto.js';
import { RankingMetaDTO } from '../common/ranking-meta.dto.js';
import type { RankingPageOnWire } from '../../types/ranking-wire.type.js';

export class GetRankingEventsResponseDTO implements GetRankingEventsWebResponse {
  static fromPage(
    events: RankedEventDTO[],
    totalCount: number,
    page: RankingPageOnWire,
  ): GetRankingEventsResponseDTO {
    const dto = new GetRankingEventsResponseDTO();
    dto.events = events;
    dto.totalCount = totalCount;
    dto.ranking = RankingMetaDTO.fromPage(page);
    return dto;
  }

  @ApiProperty({ type: [RankedEventDTO], description: 'Events in ranking order' })
  events!: RankedEventDTO[];

  @ApiProperty({ example: 100, description: 'Size of the ranked list, not of this page' })
  totalCount!: number;

  @ApiProperty({ type: RankingMetaDTO })
  ranking!: RankingMetaDTO;
}

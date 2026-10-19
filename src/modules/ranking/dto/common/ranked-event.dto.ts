import { ApiProperty } from '@nestjs/swagger';
import type { RankedEventWeb, RankingReasonWeb } from '@volontariapp/contracts';
import { EventDTO } from '../../../event/dto/common/event.dto.js';
import { RANKING_REASONS_WEB } from '../../constants/ranking.constants.js';
import { toRankingReasonsWeb } from '../../helpers/ranking-wire.helper.js';
import type { RankingItemOnWire } from '../../types/ranking-wire.type.js';

export class RankedEventDTO extends EventDTO implements RankedEventWeb {
  static fromRankedEvent(event: EventDTO, item: RankingItemOnWire): RankedEventDTO {
    const dto = Object.assign(new RankedEventDTO(), event);
    dto.rankingScore = item.score;
    dto.reasons = toRankingReasonsWeb(item.reasons);
    return dto;
  }

  @ApiProperty({ example: 0.82 })
  rankingScore!: number;

  @ApiProperty({
    enum: RANKING_REASONS_WEB,
    isArray: true,
    example: ['NEAR_YOU', 'FRIEND_INVOLVED'],
    description: 'At most two explanation codes, translated by the application',
  })
  reasons!: RankingReasonWeb[];
}

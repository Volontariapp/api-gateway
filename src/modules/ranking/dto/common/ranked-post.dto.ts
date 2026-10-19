import { ApiProperty } from '@nestjs/swagger';
import type { RankedPostWeb, RankingReasonWeb } from '@volontariapp/contracts';
import { PostDTO } from '../../../post/dto/common/post.dto.js';
import { RANKING_REASONS_WEB } from '../../constants/ranking.constants.js';
import { toRankingReasonsWeb } from '../../helpers/ranking-wire.helper.js';
import type { RankingItemOnWire } from '../../types/ranking-wire.type.js';

export class RankedPostDTO extends PostDTO implements RankedPostWeb {
  static fromRankedPost(post: PostDTO, item: RankingItemOnWire): RankedPostDTO {
    const dto = Object.assign(new RankedPostDTO(), post);
    dto.rankingScore = item.score;
    dto.reasons = toRankingReasonsWeb(item.reasons);
    return dto;
  }

  @ApiProperty({ example: 0.64 })
  rankingScore!: number;

  @ApiProperty({
    enum: RANKING_REASONS_WEB,
    isArray: true,
    example: ['FOLLOWED_AUTHOR'],
    description: 'At most two explanation codes; not displayed by the application for now',
  })
  reasons!: RankingReasonWeb[];
}

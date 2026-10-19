import { ApiProperty } from '@nestjs/swagger';
import type { GetRankingFeedWebResponse } from '@volontariapp/contracts';
import { RankedPostDTO } from '../common/ranked-post.dto.js';
import { RankingMetaDTO } from '../common/ranking-meta.dto.js';
import type { RankingPageOnWire } from '../../types/ranking-wire.type.js';

export class GetRankingFeedResponseDTO implements GetRankingFeedWebResponse {
  static fromPage(
    posts: RankedPostDTO[],
    totalCount: number,
    page: RankingPageOnWire,
  ): GetRankingFeedResponseDTO {
    const dto = new GetRankingFeedResponseDTO();
    dto.posts = posts;
    dto.totalCount = totalCount;
    dto.ranking = RankingMetaDTO.fromPage(page);
    return dto;
  }

  @ApiProperty({ type: [RankedPostDTO], description: 'Posts in ranking order' })
  posts!: RankedPostDTO[];

  @ApiProperty({ example: 100, description: 'Size of the ranked list, not of this page' })
  totalCount!: number;

  @ApiProperty({ type: RankingMetaDTO })
  ranking!: RankingMetaDTO;
}

import { ApiProperty } from '@nestjs/swagger';
import type { RankingMetaWeb, RankingSourceWeb } from '@volontariapp/contracts';
import { RANKING_SOURCES_WEB } from '../../constants/ranking.constants.js';
import { toRankingSourceWeb } from '../../helpers/ranking-wire.helper.js';
import type { RankingPageOnWire } from '../../types/ranking-wire.type.js';

export class RankingMetaDTO implements RankingMetaWeb {
  static fromPage(page: RankingPageOnWire): RankingMetaDTO {
    const dto = new RankingMetaDTO();
    dto.source = toRankingSourceWeb(page.source);
    dto.computedAt = page.computedAt;
    dto.stale = page.stale;
    dto.hasMore = page.hasMore;
    dto.versionChanged = page.versionChanged;
    dto.listVersion = page.listVersion;
    dto.nextCursor = page.nextCursor;
    return dto;
  }

  @ApiProperty({ enum: RANKING_SOURCES_WEB, example: 'STRUCTURAL_ONLY' })
  source!: RankingSourceWeb;

  @ApiProperty({ example: '2026-10-19T08:00:00.000Z', description: 'ISO 8601 date of the compute' })
  computedAt!: string;

  @ApiProperty({ example: false, description: 'The list is old and a recompute was requested' })
  stale!: boolean;

  @ApiProperty({
    example: true,
    description:
      'More ranks exist after this page. The page can be shorter than limit after filtering: use this flag, not the page length',
  })
  hasMore!: boolean;

  @ApiProperty({
    example: false,
    description: 'The list was recomputed since the cursor: the page restarts from rank 1',
  })
  versionChanged!: boolean;

  @ApiProperty({ example: '2026-10-19T08:00:00.000Z' })
  listVersion!: string;

  @ApiProperty({
    example: 'eyJ2IjoxLCJsIjoiLi4uIiwiciI6MjB9',
    description: 'Empty when hasMore is false',
  })
  nextCursor!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { RequestRankingRefreshCommand } from '@volontariapp/contracts-nest';
import type { RankingListKindWeb, RequestRankingRefreshWebRequest } from '@volontariapp/contracts';
import { RANKING_LIST_KINDS } from '../../constants/ranking.constants.js';
import { toRankingListKindGrpc } from '../../helpers/ranking-wire.helper.js';

export class RequestRankingRefreshRequestDTO implements RequestRankingRefreshWebRequest {
  @ApiProperty({ enum: RANKING_LIST_KINDS, example: 'EVENT', description: 'List to recompute' })
  @IsIn(RANKING_LIST_KINDS)
  listKind!: RankingListKindWeb;

  toCommand(): RequestRankingRefreshCommand {
    return { listKind: toRankingListKindGrpc(this.listKind) };
  }
}

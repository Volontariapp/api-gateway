import { ApiProperty } from '@nestjs/swagger';
import type { ListTagsWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class GetTagsResponseDTO implements ListTagsWebResponse {
  @ApiProperty({ type: [TagDTO] })
  tags!: TagDTO[];
}

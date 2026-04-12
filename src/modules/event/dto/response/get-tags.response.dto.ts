import { ApiProperty } from '@nestjs/swagger';
import type { GetTagsResponse } from '@volontariapp/contracts-nest';
import type { ListTagsWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class GetTagsResponseDTO
  implements GetTagsResponse, ListTagsWebResponse
{
  @ApiProperty({ type: [TagDTO] })
  tags!: TagDTO[];
}

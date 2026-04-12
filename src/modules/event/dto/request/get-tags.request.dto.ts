import { ApiProperty } from '@nestjs/swagger';
import type { GetTagsQuery } from '@volontariapp/contracts-nest';
import type { GetTagsRequest } from '@volontariapp/contracts';

export class GetTagsRequestDTO implements GetTagsRequest {
  @ApiProperty({ example: 'tech', required: false })
  slugs!: string[];

  toQuery(): GetTagsQuery {
    return { slugs: this.slugs };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { GetTagsQuery } from '@volontariapp/contracts-nest';

export class GetTagsRequestDTO {
  @ApiProperty({ example: 'tech', required: false })
  slugs?: string[];

  toQuery(): GetTagsQuery {
    return { slugs: this.slugs ?? [] };
  }
}

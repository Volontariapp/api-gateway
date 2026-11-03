import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';
import type { GetPostsLikeSummaryQuery } from '@volontariapp/contracts';

/** Reflete le plafond de ms-social (100 ids par appel); ms-social reste l autorite. */
export const MAX_LIKE_SUMMARY_POST_IDS = 100;

export class GetPostsLikeSummaryRequestDTO implements GetPostsLikeSummaryQuery {
  @ApiProperty({
    description: 'Identifiants des posts dont on veut le resume des likes (1 a 100, sans doublon)',
    example: ['uuid-post-123', 'uuid-post-456'],
    type: [String],
    minItems: 1,
    maxItems: MAX_LIKE_SUMMARY_POST_IDS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LIKE_SUMMARY_POST_IDS)
  @ArrayUnique()
  @IsString({ each: true })
  postIds!: string[];

  toQuery(): GetPostsLikeSummaryQuery {
    return { postIds: this.postIds };
  }
}

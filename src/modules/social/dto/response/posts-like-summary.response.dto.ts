import { ApiProperty } from '@nestjs/swagger';
import type { GetPostsLikeSummaryResponse } from '@volontariapp/contracts';
import { PostLikeSummaryDTO } from '../common/post-like-summary.dto.js';

export class PostsLikeSummaryResponseDTO implements GetPostsLikeSummaryResponse {
  @ApiProperty({ type: [PostLikeSummaryDTO] })
  summaries: PostLikeSummaryDTO[] = [];
}

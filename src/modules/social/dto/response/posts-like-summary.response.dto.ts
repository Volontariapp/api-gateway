import { ApiProperty } from '@nestjs/swagger';
import type { GetPostsLikeSummaryResponse, PostLikeSummary } from '@volontariapp/contracts';

export class PostLikeSummaryDTO implements PostLikeSummary {
  @ApiProperty({ example: 'uuid-post-123' })
  postId!: string;

  @ApiProperty({ example: 12 })
  likeCount!: number;

  @ApiProperty({ description: 'Vrai si l utilisateur courant a like ce post', example: true })
  likedByMe!: boolean;
}

export class PostsLikeSummaryResponseDTO implements GetPostsLikeSummaryResponse {
  @ApiProperty({ type: [PostLikeSummaryDTO] })
  summaries: PostLikeSummaryDTO[] = [];
}

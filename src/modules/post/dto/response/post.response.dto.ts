import { ApiProperty } from '@nestjs/swagger';
import {
  PostWebResponse,
  ListPostsWebResponse,
  Post,
} from '@volontariapp/contracts';

export class PostDTO implements Post {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'Post title' })
  title!: string;

  @ApiProperty({ example: 'Post content' })
  content!: string;

  @ApiProperty({ example: 'uuid-author-123' })
  authorId!: string;

  @ApiProperty({ example: ['uuid-tag-1'], isArray: true })
  tagIds!: string[];

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: Date })
  createdAt!: Date | undefined;
}

export class PostResponseDTO implements PostWebResponse {
  @ApiProperty({ type: PostDTO })
  post!: PostDTO;
}

export class ListPostsResponseDTO implements ListPostsWebResponse {
  @ApiProperty({ type: [PostDTO] })
  posts!: PostDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class PostDTO {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'PostDTO title' })
  title!: string;

  @ApiProperty({ example: 'PostDTO content' })
  content!: string;

  @ApiProperty({ example: 'uuid-author-123' })
  authorId!: string;

  @ApiProperty({ example: ['uuid-tag-1'], isArray: true })
  tagIds!: string[];

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: Date })
  createdAt!: Date | undefined;
}

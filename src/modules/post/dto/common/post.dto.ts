import { ApiProperty } from '@nestjs/swagger';
import { Post } from '@volontariapp/contracts-nest';

export abstract class PostBaseDTO {
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

export class PostResponseDTO extends PostBaseDTO {
  static fromResponse(post: Post): PostResponseDTO {
    const dto = new PostResponseDTO();
    Object.assign(dto, {
      ...post,
    });
    return dto;
  }
}

export { PostResponseDTO as PostDTO };

import { ApiProperty } from '@nestjs/swagger';
import { CommentWebResponse } from '@volontariapp/contracts';
import { Comment } from '@volontariapp/contracts-nest';

export function timestampToDate(ts?: unknown): Date {
  if (!ts) return new Date();
  if (typeof ts === 'object' && 'seconds' in (ts as Record<string, unknown>)) {
    return new Date(Number((ts as Record<string, unknown>).seconds) * 1000);
  }
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return new Date();
}

export class CommentResponseDTO implements CommentWebResponse {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'uuid-post-123' })
  postId!: string;

  @ApiProperty({ example: 'uuid-author-123' })
  authorId!: string;

  @ApiProperty({ example: 'This is my comment' })
  content!: string;

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: String })
  createdAt!: string;

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: String })
  updatedAt!: string;

  static fromResponse(comment: Comment): CommentResponseDTO {
    const dto = new CommentResponseDTO();
    dto.id = comment.id;
    dto.postId = comment.postId;
    dto.authorId = comment.authorId;
    dto.content = comment.content;

    dto.createdAt = timestampToDate(comment.createdAt).toISOString();
    dto.updatedAt = timestampToDate(comment.updatedAt).toISOString();

    return dto;
  }
}

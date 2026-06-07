import { ApiProperty } from '@nestjs/swagger';
import { ListCommentsWebResponse } from '@volontariapp/contracts';
import { ListCommentsResponse } from '@volontariapp/contracts-nest';
import { CommentResponseDTO } from './comment.response.dto.js';

export class ListCommentsResponseDTO implements ListCommentsWebResponse {
  @ApiProperty({ type: [CommentResponseDTO] })
  comments!: CommentResponseDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;

  static fromResponse(response: ListCommentsResponse): ListCommentsResponseDTO {
    const dto = new ListCommentsResponseDTO();
    dto.comments = response.comments.map((c) => CommentResponseDTO.fromResponse(c));
    dto.total = response.pagination?.total ?? 0;
    dto.page = response.pagination?.page ?? 1;
    dto.limit = response.pagination?.limit ?? 10;
    dto.totalPages = response.pagination?.totalPages ?? 1;
    dto.totalCount = response.pagination?.total ?? 0;
    return dto;
  }
}

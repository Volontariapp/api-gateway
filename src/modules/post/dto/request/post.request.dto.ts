import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  CreatePostCommand,
  UpdatePostCommand,
  ListPostsQuery,
} from '@volontariapp/contracts-nest';
import {
  CreatePostRequest,
  UpdatePostRequest,
  ListPostsRequest,
} from '@volontariapp/contracts';

export class CreatePostRequestDTO implements CreatePostRequest {
  @ApiProperty({ example: 'My first post' })
  title!: string;

  @ApiProperty({ example: 'My first post' })
  content!: string;

  @ApiProperty({ example: 'uuid-user-123' })
  authorId!: string;

  @ApiProperty({ example: ['uuid-tag-1'], isArray: true, required: false })
  tagIds!: string[];

  toCommand(): CreatePostCommand {
    return {
      title: this.title,
      content: this.content,
      authorId: this.authorId,
    };
  }
}

export class UpdatePostRequestDTO
  extends PartialType(OmitType(CreatePostRequestDTO, ['toCommand'] as const))
  implements UpdatePostRequest
{
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  toCommand(): UpdatePostCommand {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
    };
  }
}

export class ListPostsRequestDTO implements ListPostsRequest {
  @ApiProperty({ example: 10, required: false })
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  page?: number;

  @ApiProperty({ example: 'uuid-user-123', required: false })
  authorId?: string;

  toQuery(): ListPostsQuery {
    return {
      pagination: {
        limit: this.limit ?? 10,
        page: this.page ?? 0,
      },
      authorId: this.authorId,
    };
  }
}

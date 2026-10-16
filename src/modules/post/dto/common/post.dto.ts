import { ApiProperty } from '@nestjs/swagger';
import type { PostMediaStatusWeb } from '@volontariapp/contracts';
import { EventDTO } from '../../../event/dto/common/event.dto.js';
import { timestampToDate } from '../response/comment.response.dto.js';
import {
  POST_MEDIA_STATUSES,
  PostMediaDTO,
  toPostMediaStatusWeb,
  type PostOnWire,
} from './post-media.dto.js';
import type { PostMediaUrlBuilder } from './post-media-url.builder.js';

export class PostDTO {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'PostDTO title' })
  title!: string;

  @ApiProperty({ example: 'PostDTO content' })
  content!: string;

  @ApiProperty({ example: 'uuid-author-123' })
  authorId!: string;

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: Date })
  createdAt!: Date;

  @ApiProperty({ example: '2026-04-12T12:00:00Z', type: Date })
  updatedAt!: Date;

  @ApiProperty({ type: () => EventDTO, required: false })
  event?: EventDTO;

  @ApiProperty({ type: [PostMediaDTO], description: 'Media ordered by position' })
  media!: PostMediaDTO[];

  @ApiProperty({
    enum: POST_MEDIA_STATUSES,
    example: 'READY',
    description: 'Aggregated processing state of the media. media[].url is only set when READY',
  })
  mediaStatus!: PostMediaStatusWeb;

  static fromPost(post: PostOnWire, urls: PostMediaUrlBuilder, event?: EventDTO): PostDTO {
    const dto = new PostDTO();
    dto.id = post.id;
    dto.title = post.title;
    dto.content = post.content;
    dto.authorId = post.authorId;
    dto.createdAt = timestampToDate(post.createdAt);
    dto.updatedAt = timestampToDate(post.updatedAt);
    dto.mediaStatus = toPostMediaStatusWeb(post.mediaStatus);
    dto.media = [...post.media]
      .sort((a, b) => a.position - b.position)
      .map((media) => PostMediaDTO.fromPostMedia(media, dto.mediaStatus, urls));
    if (event) {
      dto.event = event;
    }
    return dto;
  }
}

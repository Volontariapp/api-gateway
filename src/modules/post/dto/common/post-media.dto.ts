import { ApiProperty } from '@nestjs/swagger';
import { PostMediaStatus, type PostMedia } from '@volontariapp/contracts-nest';
import type { PostMediaStatusWeb, PostMediaWeb } from '@volontariapp/contracts';
import type { PostMediaUrlBuilder } from './post-media-url.builder.js';

export const POST_MEDIA_STATUSES: readonly PostMediaStatusWeb[] = [
  'NONE',
  'PENDING',
  'READY',
  'REJECTED',
];

export function toPostMediaStatusWeb(status: PostMediaStatus): PostMediaStatusWeb {
  switch (status) {
    case PostMediaStatus.POST_MEDIA_STATUS_PENDING:
      return 'PENDING';
    case PostMediaStatus.POST_MEDIA_STATUS_READY:
      return 'READY';
    case PostMediaStatus.POST_MEDIA_STATUS_REJECTED:
      return 'REJECTED';
    case PostMediaStatus.POST_MEDIA_STATUS_NONE:
    case PostMediaStatus.POST_MEDIA_STATUS_UNSPECIFIED:
    default:
      return 'NONE';
  }
}

export class PostMediaDTO implements PostMediaWeb {
  @ApiProperty({ example: '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13' })
  fileId!: string;

  @ApiProperty({ example: 0, description: 'Display order of the media inside the post' })
  position!: number;

  @ApiProperty({
    required: false,
    example: 'https://cdn.example.com/post/9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13.webp',
    description: 'Public URL of the media, only present once the post mediaStatus is READY',
  })
  url?: string;

  /** The URL is only computed (and exposed) when the whole post media is READY. */
  static fromPostMedia(
    media: PostMedia,
    status: PostMediaStatusWeb,
    urls: PostMediaUrlBuilder,
  ): PostMediaDTO {
    const dto = new PostMediaDTO();
    dto.fileId = media.fileId;
    dto.position = media.position;
    if (status === 'READY') {
      const url = urls.forPostMedia(media.fileId);
      if (url !== undefined) {
        dto.url = url;
      }
    }
    return dto;
  }
}

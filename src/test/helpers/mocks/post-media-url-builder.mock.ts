import type { PostMediaUrlBuilder } from '../../../modules/post/dto/common/post-media-url.builder.js';

export const POST_MEDIA_URL_BASE = 'https://cdn.test/post';

export class PostMediaUrlBuilderMock implements PostMediaUrlBuilder {
  forPostMedia(fileId: string): string | undefined {
    return `${POST_MEDIA_URL_BASE}/${fileId}.webp`;
  }
}

export class EmptyPostMediaUrlBuilderMock implements PostMediaUrlBuilder {
  forPostMedia(_fileId: string): string | undefined {
    return undefined;
  }
}

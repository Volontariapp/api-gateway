import { PostMediaStatus, type Post, type PostMedia } from '@volontariapp/contracts-nest';
import type {
  PostOnWire,
  PostMediaStatusOnWire,
} from '../../../modules/post/dto/common/post-media.dto.js';

export const POST_FILE_ID_1 = '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13';
export const POST_FILE_ID_2 = '3c8e7a10-5b2d-4f6a-9d14-7e0b1a2c3d4e';

export class PostFactory {
  static createMedia(overrides: Partial<PostMedia> = {}): PostMedia {
    return {
      fileId: overrides.fileId ?? POST_FILE_ID_1,
      position: overrides.position ?? 0,
    };
  }

  static createPost(overrides: Partial<Post> = {}): Post {
    return {
      id: overrides.id ?? '123e4567-e89b-12d3-a456-426614174000',
      authorId: overrides.authorId ?? '223e4567-e89b-12d3-a456-426614174000',
      title: overrides.title ?? 'Mission Maraude Paris',
      content: overrides.content ?? 'Besoin de 5 benevoles ce samedi',
      createdAt: overrides.createdAt ?? { seconds: 1_790_000_000, nanos: 0 },
      updatedAt: overrides.updatedAt ?? { seconds: 1_790_000_100, nanos: 0 },
      eventId: overrides.eventId,
      media: overrides.media ?? [],
      mediaStatus: overrides.mediaStatus ?? PostMediaStatus.POST_MEDIA_STATUS_NONE,
    };
  }

  static createPostWithMedia(
    status: PostMediaStatus,
    media: PostMedia[] = [PostFactory.createMedia()],
  ): Post {
    return PostFactory.createPost({ media, mediaStatus: status });
  }

  /** Post tel que le client gRPC de la gateway le décode : `enums: String`, donc le statut est un nom. */
  static createWirePost(
    status: PostMediaStatusOnWire,
    media: PostMedia[] = [PostFactory.createMedia()],
  ): PostOnWire {
    return { ...PostFactory.createPost({ media }), mediaStatus: status };
  }
}

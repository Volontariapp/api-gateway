import { PostMediaStatus } from '@volontariapp/contracts-nest';
import { PostResponseDTO } from '../../../../modules/post/dto/response/post.response.dto.js';
import { GetPostResponseDTO } from '../../../../modules/post/dto/response/get-post.response.dto.js';
import { ListPostsResponseDTO } from '../../../../modules/post/dto/response/list-posts.response.dto.js';
import {
  POST_MEDIA_URL_BASE,
  PostMediaUrlBuilderMock,
} from '../../../helpers/mocks/post-media-url-builder.mock.js';
import { POST_FILE_ID_1, PostFactory } from '../../../helpers/factories/post.factory.js';

const READY_URL = `${POST_MEDIA_URL_BASE}/${POST_FILE_ID_1}.webp`;
const readyPost = () => PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_READY);
const pendingPost = () =>
  PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_PENDING);

describe('Post response DTOs media exposure (Unit)', () => {
  const urls = new PostMediaUrlBuilderMock();

  it('PostResponseDTO should expose media and mediaStatus', () => {
    const dto = PostResponseDTO.fromResponse({ post: readyPost() }, urls);

    expect(dto.post.mediaStatus).toBe('READY');
    expect(dto.post.media[0].url).toBe(READY_URL);
  });

  it('GetPostResponseDTO should expose media and mediaStatus', () => {
    const dto = GetPostResponseDTO.fromResponse({ post: readyPost() }, urls);

    expect(dto.post.mediaStatus).toBe('READY');
    expect(dto.post.media[0].url).toBe(READY_URL);
  });

  it('ListPostsResponseDTO should expose media per post and hide the url of pending ones', () => {
    const dto = ListPostsResponseDTO.fromResponse(
      {
        posts: [readyPost(), pendingPost()],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
      urls,
    );

    expect(dto.posts[0].media[0].url).toBe(READY_URL);
    expect(dto.posts[1].mediaStatus).toBe('PENDING');
    expect(JSON.parse(JSON.stringify(dto.posts[1].media[0]))).not.toHaveProperty('url');
  });
});

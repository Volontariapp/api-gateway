import { jest } from '@jest/globals';
import { PostMediaStatus } from '@volontariapp/contracts-nest';
import { PostDTO } from '../../../../modules/post/dto/common/post.dto.js';
import {
  EmptyPostMediaUrlBuilderMock,
  POST_MEDIA_URL_BASE,
  PostMediaUrlBuilderMock,
} from '../../../helpers/mocks/post-media-url-builder.mock.js';
import {
  POST_FILE_ID_1,
  POST_FILE_ID_2,
  PostFactory,
} from '../../../helpers/factories/post.factory.js';

/** What the client receives: undefined fields are dropped by JSON serialization. */
const serialized = (value: unknown): Record<string, unknown> =>
  JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

describe('PostDTO.fromPost (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should expose media[].url when the media status is READY', () => {
    const post = PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_READY);

    const dto = PostDTO.fromPost(post, new PostMediaUrlBuilderMock());

    expect(dto.mediaStatus).toBe('READY');
    expect(dto.media).toEqual([
      { fileId: POST_FILE_ID_1, position: 0, url: `${POST_MEDIA_URL_BASE}/${POST_FILE_ID_1}.webp` },
    ]);
  });

  it('should order the media by position', () => {
    const post = PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_READY, [
      PostFactory.createMedia({ fileId: POST_FILE_ID_2, position: 1 }),
      PostFactory.createMedia({ fileId: POST_FILE_ID_1, position: 0 }),
    ]);

    const dto = PostDTO.fromPost(post, new PostMediaUrlBuilderMock());

    expect(dto.media.map((m) => m.fileId)).toEqual([POST_FILE_ID_1, POST_FILE_ID_2]);
  });

  it.each([
    [PostMediaStatus.POST_MEDIA_STATUS_PENDING, 'PENDING'],
    [PostMediaStatus.POST_MEDIA_STATUS_REJECTED, 'REJECTED'],
  ])('should omit the url and never build it when the status is %s', (status, expected) => {
    const urls = new PostMediaUrlBuilderMock();
    const buildUrl = jest.spyOn(urls, 'forPostMedia');

    const dto = PostDTO.fromPost(PostFactory.createPostWithMedia(status), urls);

    expect(dto.mediaStatus).toBe(expected);
    expect(dto.media).toEqual([{ fileId: POST_FILE_ID_1, position: 0 }]);
    expect(serialized(dto.media[0])).not.toHaveProperty('url');
    expect(buildUrl).not.toHaveBeenCalled();
  });

  it('should return an empty media list when the post has no media', () => {
    const dto = PostDTO.fromPost(PostFactory.createPost(), new PostMediaUrlBuilderMock());

    expect(dto.mediaStatus).toBe('NONE');
    expect(dto.media).toEqual([]);
  });

  it('should map an unspecified status to NONE without any url', () => {
    const post = PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_UNSPECIFIED);

    const dto = PostDTO.fromPost(post, new PostMediaUrlBuilderMock());

    expect(dto.mediaStatus).toBe('NONE');
    expect(serialized(dto.media[0])).not.toHaveProperty('url');
  });

  it('should omit the url of a READY media when the builder cannot compute it', () => {
    const post = PostFactory.createPostWithMedia(PostMediaStatus.POST_MEDIA_STATUS_READY);

    const dto = PostDTO.fromPost(post, new EmptyPostMediaUrlBuilderMock());

    expect(dto.media[0]).toEqual({ fileId: POST_FILE_ID_1, position: 0 });
  });

  it('should keep the scalar fields and attach the event', () => {
    const post = PostFactory.createPost({ title: 'Titre' });
    const event = Object.assign(Object.create(null), { id: 'event-1' }) as never;

    const dto = PostDTO.fromPost(post, new PostMediaUrlBuilderMock(), event);

    expect(dto.id).toBe(post.id);
    expect(dto.title).toBe('Titre');
    expect(dto.authorId).toBe(post.authorId);
    expect(dto.createdAt).toEqual(new Date(1_790_000_000 * 1000));
    expect(dto.event).toBe(event);
  });

  describe('with the enum names the gRPC client really delivers', () => {
    it('exposes media[].url when the status is the name POST_MEDIA_STATUS_READY', () => {
      const post = PostFactory.createWirePost('POST_MEDIA_STATUS_READY');

      const dto = PostDTO.fromPost(post, new PostMediaUrlBuilderMock());

      expect(dto.mediaStatus).toBe('READY');
      expect(dto.media[0]?.url).toBe(`${POST_MEDIA_URL_BASE}/${POST_FILE_ID_1}.webp`);
    });

    it.each([
      ['POST_MEDIA_STATUS_PENDING', 'PENDING'],
      ['POST_MEDIA_STATUS_REJECTED', 'REJECTED'],
    ] as const)('omits the url for the name %s', (name, expected) => {
      const urls = new PostMediaUrlBuilderMock();
      const buildUrl = jest.spyOn(urls, 'forPostMedia');

      const dto = PostDTO.fromPost(PostFactory.createWirePost(name), urls);

      expect(dto.mediaStatus).toBe(expected);
      expect(serialized(dto.media[0])).not.toHaveProperty('url');
      expect(buildUrl).not.toHaveBeenCalled();
    });

    it.each(['POST_MEDIA_STATUS_NONE', 'POST_MEDIA_STATUS_UNSPECIFIED', 'UNRECOGNIZED'] as const)(
      'maps the name %s to NONE without any url',
      (name) => {
        const dto = PostDTO.fromPost(
          PostFactory.createWirePost(name),
          new PostMediaUrlBuilderMock(),
        );

        expect(dto.mediaStatus).toBe('NONE');
        expect(serialized(dto.media[0])).not.toHaveProperty('url');
      },
    );
  });
});

import { jest } from '@jest/globals';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';

const AVATAR_FILE_ID = '9b2f1c52-7a63-4d0e-8f41-0c5d2e6a7b13';

describe('PublicFileUrlService (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('forUserAvatar', () => {
    it('should build the public avatar URL from the configured base URL', () => {
      const service = PublicFileUrlFactory.createService(
        'http://localhost:9000/volontariapp-public',
      );

      expect(service.forUserAvatar(AVATAR_FILE_ID)).toBe(
        `http://localhost:9000/volontariapp-public/user-avatar/${AVATAR_FILE_ID}.webp`,
      );
    });

    it('should ignore trailing slashes of the base URL', () => {
      const service = PublicFileUrlFactory.createService('https://cdn.example.com/pub//');

      expect(service.forUserAvatar(AVATAR_FILE_ID)).toBe(
        `https://cdn.example.com/pub/user-avatar/${AVATAR_FILE_ID}.webp`,
      );
    });

    it('should return undefined when the user has no avatar', () => {
      const service = PublicFileUrlFactory.createService('http://localhost:9000/pub');

      expect(service.forUserAvatar(undefined)).toBeUndefined();
    });

    it('should return undefined instead of failing when no base URL is configured', () => {
      const service = PublicFileUrlFactory.createService();

      expect(service.forUserAvatar(AVATAR_FILE_ID)).toBeUndefined();
    });

    it('should return undefined instead of failing when the base URL is blank', () => {
      const service = PublicFileUrlFactory.createService('   ');

      expect(service.forUserAvatar(AVATAR_FILE_ID)).toBeUndefined();
    });

    it('should return undefined instead of failing when the file id is not valid', () => {
      const service = PublicFileUrlFactory.createService('http://localhost:9000/pub');

      expect(service.forUserAvatar('not-a-uuid')).toBeUndefined();
    });
  });
});

describe('PublicFileUrlService.forPostMedia (Unit)', () => {
  const POST_FILE_ID = '3c8e7a10-5b2d-4f6a-9d14-7e0b1a2c3d4e';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should build the public post media URL from the configured base URL', () => {
    const service = PublicFileUrlFactory.createService('http://localhost:9000/volontariapp-public');

    expect(service.forPostMedia(POST_FILE_ID)).toBe(
      `http://localhost:9000/volontariapp-public/post/${POST_FILE_ID}.webp`,
    );
  });

  it('should ignore trailing slashes of the base URL', () => {
    const service = PublicFileUrlFactory.createService('https://cdn.example.com/pub//');

    expect(service.forPostMedia(POST_FILE_ID)).toBe(
      `https://cdn.example.com/pub/post/${POST_FILE_ID}.webp`,
    );
  });

  it('should return undefined when the file id is empty', () => {
    const service = PublicFileUrlFactory.createService('http://localhost:9000/pub');

    expect(service.forPostMedia('')).toBeUndefined();
  });

  it('should return undefined instead of failing when no base URL is configured', () => {
    expect(PublicFileUrlFactory.createService().forPostMedia(POST_FILE_ID)).toBeUndefined();
  });

  it('should return undefined instead of failing when the file id is not valid', () => {
    const service = PublicFileUrlFactory.createService('http://localhost:9000/pub');

    expect(service.forPostMedia('not-a-uuid')).toBeUndefined();
  });
});

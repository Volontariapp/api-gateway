import type { GenerateUploadUrlRequest } from '@volontariapp/contracts';
import type { EntityType } from '@volontariapp/contracts-nest';
import { encodeNoisePng } from './png-encoder.helper.js';

/** A real 1x1 PNG (70 bytes, valid chunks): small enough for the synchronous validation. */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const TINY_PNG_MIME_TYPE = 'image/png';

/** Synchronous threshold of the post and event cover policies, and the maximum size of an avatar. */
export const ONE_MEGABYTE = 1024 * 1024;

/** 1400 x 1400 px of noise, about 5.9 MB: above the synchronous threshold, below the 10 MB maximum. */
const LARGE_PNG_SIDE_PX = 1400;

export const tinyPngFactory = (): Buffer => Buffer.from(TINY_PNG_BASE64, 'base64');

/** A valid PNG above the 1 MB synchronous threshold, so the scan runs in `worker-storage`. */
export const largePngFactory = (): Buffer => encodeNoisePng(LARGE_PNG_SIDE_PX);

/** Body of POST /storage/upload-url declaring `image` (the tiny PNG by default) for `entityType`. */
export const uploadUrlRequestFactory = (
  entityType: EntityType,
  overrides?: Partial<GenerateUploadUrlRequest>,
  image: Buffer = tinyPngFactory(),
): GenerateUploadUrlRequest => ({
  mimeType: TINY_PNG_MIME_TYPE,
  sizeBytes: image.length,
  entityType,
  ...overrides,
});

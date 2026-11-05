import type { GenerateUploadUrlRequest } from '@volontariapp/contracts';
import type { EntityType } from '@volontariapp/contracts-nest';

/** A real 1x1 PNG (70 bytes, valid chunks): small enough for the synchronous validation. */
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export const TINY_PNG_MIME_TYPE = 'image/png';

export const tinyPngFactory = (): Buffer => Buffer.from(TINY_PNG_BASE64, 'base64');

/** Body of POST /storage/upload-url declaring the tiny PNG for `entityType`. */
export const uploadUrlRequestFactory = (
  entityType: EntityType,
  overrides?: Partial<GenerateUploadUrlRequest>,
): GenerateUploadUrlRequest => ({
  mimeType: TINY_PNG_MIME_TYPE,
  sizeBytes: tinyPngFactory().length,
  entityType,
  ...overrides,
});

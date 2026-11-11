import { crc32, deflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BYTES_PER_PIXEL = 3;
const BIT_DEPTH = 8;
const COLOR_TYPE_RGB = 2;
const FILTER_NONE = 0;

/** Chunk layout: length (4), type (4), data, CRC-32 of type and data (4). */
function pngChunk(type: string, data: Buffer): Buffer {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

/** xorshift32: the same seed always gives the same bytes, so the file never changes between runs. */
function noiseBytes(length: number, seed: number): Buffer {
  const bytes = Buffer.alloc(length);
  let state = seed;
  for (let index = 0; index < length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[index] = state & 0xff;
  }
  return bytes;
}

/**
 * A valid RGB PNG filled with deterministic noise, stored without compression: the file weighs
 * about `width * height * 3` bytes, so a side of 1400 px gives roughly 5.9 MB. Noise keeps the
 * decoder and the re-encoder of the storage pipeline busy, which a flat picture would not.
 */
export function encodeNoisePng(sidePx: number, seed = 0x2f6e2b1): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(sidePx, 0);
  header.writeUInt32BE(sidePx, 4);
  header[8] = BIT_DEPTH;
  header[9] = COLOR_TYPE_RGB;
  // Bytes 10 to 12 (compression, filter, interlace) stay at 0.

  const rowLength = 1 + sidePx * BYTES_PER_PIXEL;
  const pixels = noiseBytes(sidePx * sidePx * BYTES_PER_PIXEL, seed);
  const scanlines = Buffer.alloc(rowLength * sidePx);
  for (let row = 0; row < sidePx; row += 1) {
    const rowStart = row * rowLength;
    scanlines[rowStart] = FILTER_NONE;
    pixels.copy(
      scanlines,
      rowStart + 1,
      row * sidePx * BYTES_PER_PIXEL,
      (row + 1) * sidePx * BYTES_PER_PIXEL,
    );
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 0 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

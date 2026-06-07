import { randomUUID } from 'node:crypto';
import type { TestClient } from '../helpers/test-client.helper.js';
import type {
  PostWebResponse,
  CommentWebResponse,
  CreatePostRequest,
  CreateCommentRequest,
} from '@volontariapp/contracts';
import { createPostRequestFactory, createCommentRequestFactory } from './post-test.factory.js';

// ─── Post helpers ─────────────────────────────────────────────────────────────

export async function createPost(
  client: TestClient,
  overrides?: Partial<CreatePostRequest>,
): Promise<{ postId: string; post: PostWebResponse['post']; dto: CreatePostRequest }> {
  const dto = createPostRequestFactory(overrides);
  const res = await client.post('/api/v1/posts').send(dto).expect(201);
  const body = res.body as PostWebResponse;
  return { postId: body.post.id, post: body.post, dto };
}

export async function createComment(
  client: TestClient,
  postId: string,
  overrides?: Partial<CreateCommentRequest>,
): Promise<{ commentId: string; comment: CommentWebResponse; dto: CreateCommentRequest }> {
  const dto = createCommentRequestFactory(overrides);
  const res = await client.post(`/api/v1/posts/${postId}/comments`).send(dto).expect(201);
  const body = res.body as CommentWebResponse;
  return { commentId: body.id, comment: body, dto };
}

// ─── Date assertion ────────────────────────────────────────────────────────────

/**
 * Asserts that a value is a valid ISO 8601 date string — NOT a raw gRPC Timestamp
 * ({ seconds, nanos }), a plain numeric epoch (1700000000000), or an invalid date.
 *
 * Valid examples:
 *   "2026-06-07T20:32:11.380Z"
 *   "2026-06-07T22:32:11+02:00"
 *
 * Invalid examples:
 *   { seconds: 1234, nanos: 0 }   ← raw proto Timestamp
 *   1749332131380                  ← epoch ms number
 *   "1749332131380"                ← epoch ms string
 *   undefined / null
 */
export function assertIsoDate(value: unknown, fieldPath: string): void {
  const fail = (reason: string): never => {
    throw new Error(`[assertIsoDate] "${fieldPath}" — ${reason} (got: ${JSON.stringify(value)})`);
  };

  if (typeof value !== 'string') {
    fail(`expected string, got ${typeof value}`);
  }

  const dateStr = value as string;
  const parsed = new Date(dateStr);

  if (parsed.toString() === 'Invalid Date') {
    fail(`not a parseable date: "${dateStr}"`);
  }

  if (!Number.isNaN(Number(dateStr))) {
    fail(`looks like a raw numeric epoch: "${dateStr}"`);
  }

  if (!dateStr.includes('T')) {
    fail(`missing 'T' separator — not ISO 8601: "${dateStr}"`);
  }

  if (!/Z$|[+-]\d{2}:\d{2}$/.test(dateStr)) {
    fail(`missing timezone info (Z or ±HH:MM): "${dateStr}"`);
  }

  if (parsed.getFullYear() <= 2020) {
    fail(`year ${String(parsed.getFullYear())} ≤ 2020 — likely an epoch-zero date`);
  }

  // All checks passed — assert positively so Jest registers the assertion
  expect(typeof value).toBe('string');
  expect(dateStr).toContain('T');
}

// ─── Unique title factory ────────────────────────────────────────────────────

export const uniqueTitle = (prefix = 'Post'): string => `${prefix}-${randomUUID()}`;

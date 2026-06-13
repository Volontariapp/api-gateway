import { randomUUID } from 'node:crypto';
import type { CreatePostRequest, CreateCommentRequest } from '@volontariapp/contracts';

export const createPostRequestFactory = (
  overrides?: Partial<CreatePostRequest>,
): CreatePostRequest => {
  return {
    title: `Post Title ${randomUUID()}`,
    content: `This is the content of the post ${randomUUID()}. It is sufficiently long to pass validation.`,
    ...overrides,
  };
};

export const createCommentRequestFactory = (
  overrides?: Partial<CreateCommentRequest>,
): CreateCommentRequest => {
  return {
    content: `This is a comment content ${randomUUID()}.`,
    ...overrides,
  };
};

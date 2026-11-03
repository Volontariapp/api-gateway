import type { GetPostsLikeSummaryResponse, PostLikeSummary } from '@volontariapp/contracts-nest';

export const createPostLikeSummaryFactory = (
  overrides: Partial<PostLikeSummary> = {},
): PostLikeSummary => ({
  postId: 'post-1',
  likeCount: 3,
  likedByMe: false,
  ...overrides,
});

export const createGetPostsLikeSummaryResponseFactory = (
  summaries: PostLikeSummary[] = [
    createPostLikeSummaryFactory(),
    createPostLikeSummaryFactory({ postId: 'post-2', likeCount: 0 }),
  ],
): GetPostsLikeSummaryResponse => ({ summaries });

/** Identifiants de test distincts : post-0, post-1, ... */
export const createPostIdsFactory = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `post-${String(i)}`);

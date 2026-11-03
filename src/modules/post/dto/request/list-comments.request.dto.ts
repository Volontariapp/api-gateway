import { ListCommentsQuery } from '@volontariapp/contracts-nest';
import type { ListCommentsRequest } from '@volontariapp/contracts';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PaginationLimit,
  PaginationPage,
} from '../../../../common/pagination/index.js';

export class ListCommentsRequestDTO implements ListCommentsRequest {
  @PaginationPage()
  page: number = DEFAULT_PAGE;

  @PaginationLimit()
  limit: number = DEFAULT_LIMIT;

  postId!: string;

  toQuery(): ListCommentsQuery {
    return {
      postId: this.postId,
      pagination: {
        page: this.page,
        limit: this.limit,
      },
    };
  }
}

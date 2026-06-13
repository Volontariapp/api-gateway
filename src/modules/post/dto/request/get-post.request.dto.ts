import type { GetPostQuery } from '@volontariapp/contracts-nest';
import type { GetPostRequest } from '@volontariapp/contracts';

//GetPostRequestDto
export class GetPostRequestDTO implements GetPostRequest {
  id!: string;

  toQuery(): GetPostQuery {
    return { id: this.id };
  }
}

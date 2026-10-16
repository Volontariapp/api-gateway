import type { GetFileMetadataQuery } from '@volontariapp/contracts-nest';
import type { GetFileMetadataRequest } from '@volontariapp/contracts';

export class GetFileMetadataRequestDTO implements GetFileMetadataRequest {
  fileId!: string;

  toQuery(): GetFileMetadataQuery {
    return { fileId: this.fileId };
  }
}

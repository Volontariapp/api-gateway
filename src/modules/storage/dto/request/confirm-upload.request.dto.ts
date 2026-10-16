import type { ConfirmUploadCommand } from '@volontariapp/contracts-nest';
import type { ConfirmUploadRequest } from '@volontariapp/contracts';

export class ConfirmUploadRequestDTO implements ConfirmUploadRequest {
  fileId!: string;

  toCommand(): ConfirmUploadCommand {
    return { fileId: this.fileId };
  }
}

import type { DeleteBlockCommand } from '@volontariapp/contracts';
import type { DeleteBlockCommand as DeleteBlockCommandType } from '@volontariapp/contracts-nest';

export class DeleteBlockUserRequestDTO implements DeleteBlockCommand {
  blockedId!: string;

  toCommand(): DeleteBlockCommandType {
    return { blockedId: this.blockedId };
  }
}

import type { AdminDeleteBlockCommand } from '@volontariapp/contracts';
import type { AdminDeleteBlockCommand as AdminDeleteBlockCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteBlockUserRequestDTO implements AdminDeleteBlockCommand {
  blockerId!: string;
  blockedId!: string;

  toCommand(): AdminDeleteBlockCommandType {
    return { blockerId: this.blockerId, blockedId: this.blockedId };
  }
}

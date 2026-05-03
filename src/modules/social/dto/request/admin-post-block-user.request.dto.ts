import type { AdminCreateBlockCommand } from '@volontariapp/contracts';
import type { AdminCreateBlockCommand as AdminCreateBlockCommandType } from '@volontariapp/contracts-nest';

export class AdminPostBlockUserRequestDTO implements AdminCreateBlockCommand {
  blockerId!: string;
  blockedId!: string;

  toCommand(): AdminCreateBlockCommandType {
    return { blockerId: this.blockerId, blockedId: this.blockedId };
  }
}

import type { CreateBlockCommand } from '@volontariapp/contracts';
import type { CreateBlockCommand as CreateBlockCommandType } from '@volontariapp/contracts-nest';

export class PostBlockUserRequestDTO implements CreateBlockCommand {
  blockedId!: string;

  toCommand(): CreateBlockCommandType {
    return { blockedId: this.blockedId };
  }
}

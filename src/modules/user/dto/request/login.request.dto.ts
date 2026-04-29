import { ApiProperty } from '@nestjs/swagger';
import { LoginCommand } from '@volontariapp/contracts-nest';

export class LoginRequestDTO {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;

  toCommand(): LoginCommand {
    return { email: this.email, password: this.password };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { SignUpCommand } from '@volontariapp/contracts-nest';
import { SignUpRequest } from '@volontariapp/contracts';

export class CreateUserRequestDTO implements SignUpRequest {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'john_doe' })
  pseudo!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;

  @ApiProperty({ example: 'My bio', required: false })
  bio?: string;

  toCommand(): SignUpCommand {
    return {
      email: this.email,
      pseudo: this.pseudo,
      password: this.password,
      bio: this.bio,
    };
  }
}

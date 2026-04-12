import { ApiProperty } from '@nestjs/swagger';
import { CreateUserCommand } from '@volontariapp/contracts-nest';
import { CreateUserRequest } from '@volontariapp/contracts';

export class CreateUserRequestDTO implements CreateUserRequest {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;

  @ApiProperty({ example: 'USER' })
  role!: string;

  toCommand(): CreateUserCommand {
    return {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      password: this.password,
      role: this.role,
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { UserWebResponse, ListUsersWebResponse } from '@volontariapp/contracts';

export class UserDTO {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @ApiProperty({ example: 'USER' })
  role!: string;
}

export class UserResponseDTO implements UserWebResponse {
  @ApiProperty({ type: UserDTO })
  user!: UserDTO;
}

export class ListUsersResponseDTO implements ListUsersWebResponse {
  @ApiProperty({ type: [UserDTO] })
  users!: UserDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;
}

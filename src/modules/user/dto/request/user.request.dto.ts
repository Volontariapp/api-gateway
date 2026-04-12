import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  CreateUserCommand,
  UpdateUserCommand,
  ListUsersQuery,
} from '@volontariapp/contracts-nest';
import {
  CreateUserRequest,
  UpdateUserRequest,
  ListUsersRequest,
} from '@volontariapp/contracts';
import { PaginationDTO } from '../../../event/dto/common/pagination.dto.js';

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

export class UpdateUserRequestDTO
  extends PartialType(OmitType(CreateUserRequestDTO, ['toCommand'] as const))
  implements UpdateUserRequest
{
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  toCommand(): UpdateUserCommand {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
    };
  }
}

export class ListUsersRequestDTO implements ListUsersRequest {
  @ApiProperty({ type: PaginationDTO })
  pagination!: PaginationDTO;

  toQuery(): ListUsersQuery {
    return {
      pagination: {
        limit: this.pagination.limit,
        page: this.pagination.page,
      },
    };
  }
}

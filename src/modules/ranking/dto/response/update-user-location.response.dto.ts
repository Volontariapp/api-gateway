import { ApiProperty } from '@nestjs/swagger';
import type { UpdateUserLocationResponse } from '@volontariapp/contracts-nest';
import type { UpdateUserLocationWebResponse } from '@volontariapp/contracts';

export class UpdateUserLocationResponseDTO implements UpdateUserLocationWebResponse {
  static fromResponse(response: UpdateUserLocationResponse): UpdateUserLocationResponseDTO {
    const dto = new UpdateUserLocationResponseDTO();
    dto.accepted = response.accepted;
    return dto;
  }

  @ApiProperty({
    example: true,
    description: 'False when the position was ignored (more than 1 update per minute)',
  })
  accepted!: boolean;
}

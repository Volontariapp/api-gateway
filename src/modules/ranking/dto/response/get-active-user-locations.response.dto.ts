import { ApiProperty } from '@nestjs/swagger';
import type { GetActiveUserLocationsResponse } from '@volontariapp/contracts-nest';
import type { GetActiveUserLocationsWebResponse } from '@volontariapp/contracts';
import { UserLocationCellDTO } from '../common/index.js';

export class GetActiveUserLocationsResponseDTO implements GetActiveUserLocationsWebResponse {
  static fromResponse(response: GetActiveUserLocationsResponse): GetActiveUserLocationsResponseDTO {
    const dto = new GetActiveUserLocationsResponseDTO();
    dto.cells = response.cells.map((cell) => {
      const item = new UserLocationCellDTO();
      item.lat = cell.lat;
      item.lng = cell.lng;
      return item;
    });
    return dto;
  }

  @ApiProperty({
    type: [UserLocationCellDTO],
    description: 'Distinct positions rounded to 1 km, one per cell, never one per user',
  })
  cells!: UserLocationCellDTO[];
}

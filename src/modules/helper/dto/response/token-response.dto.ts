import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDTO {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The generated JWT token',
  })
  token!: string;
}

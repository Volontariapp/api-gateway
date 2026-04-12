import { ApiProperty } from '@nestjs/swagger';
import {
  GetEventQuery,
  ListRequirementsQuery,
  GetTagsQuery,
} from '@volontariapp/contracts-nest';

export class GetEventQueryDTO implements GetEventQuery {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  toQuery(): GetEventQuery {
    return {
      id: this.id,
    };
  }
}

export class ListRequirementsQueryDTO implements ListRequirementsQuery {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  eventId!: string;

  toQuery(): ListRequirementsQuery {
    return {
      eventId: this.eventId,
    };
  }
}

export class GetTagsQueryDTO implements GetTagsQuery {
  @ApiProperty({ example: ['tech'], isArray: true, required: false })
  slugs!: string[];

  toQuery(): GetTagsQuery {
    return {
      slugs: this.slugs,
    };
  }
}

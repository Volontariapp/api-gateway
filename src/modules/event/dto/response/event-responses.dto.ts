import { ApiProperty } from '@nestjs/swagger';
import {
  CreateEventResponse,
  UpdateEventResponse,
  ChangeEventStateResponse,
  ManageRequirementsResponse,
  GetEventResponse,
  SearchEventsResponse,
  ListRequirementsResponse,
  GetTagsResponse,
  CreateTagResponse,
  UpdateTagResponse,
  DeleteTagResponse,
  DeleteEventResponse,
} from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';
import { RequirementDTO, TagDTO } from '../common/common.dto.js';

export class CreateEventResponseDTO implements CreateEventResponse {
  @ApiProperty({ type: EventDTO, required: false })
  event: EventDTO | undefined;
}

export class UpdateEventResponseDTO implements UpdateEventResponse {
  @ApiProperty({ type: EventDTO, required: false })
  event: EventDTO | undefined;
}

export class ChangeEventStateResponseDTO implements ChangeEventStateResponse {
  @ApiProperty({ type: EventDTO, required: false })
  event: EventDTO | undefined;
}

export class ManageRequirementsResponseDTO implements ManageRequirementsResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Requirement processed successfully' })
  message!: string;
}

export class DeleteEventResponseDTO implements DeleteEventResponse {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class GetEventResponseDTO implements GetEventResponse {
  @ApiProperty({ type: EventDTO, required: false })
  event: EventDTO | undefined;
}

export class SearchEventsResponseDTO implements SearchEventsResponse {
  @ApiProperty({ type: [EventDTO] })
  events!: EventDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;
}

export class ListRequirementsResponseDTO implements ListRequirementsResponse {
  @ApiProperty({ type: [RequirementDTO] })
  requirements!: RequirementDTO[];
}

export class GetTagsResponseDTO implements GetTagsResponse {
  @ApiProperty({ type: [TagDTO] })
  tags!: TagDTO[];
}

export class CreateTagResponseDTO implements CreateTagResponse {
  @ApiProperty({ type: TagDTO, required: false })
  tag: TagDTO | undefined;
}

export class UpdateTagResponseDTO implements UpdateTagResponse {
  @ApiProperty({ type: TagDTO, required: false })
  tag: TagDTO | undefined;
}

export class DeleteTagResponseDTO implements DeleteTagResponse {
  @ApiProperty({ example: true })
  success!: boolean;
}

import {
  Body,
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  TAG_COMMAND_SERVICE_NAME,
  TagCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { CreateTagCommandDTO } from '../dto/request/command/create-tag.command.dto.js';
import { UpdateTagCommandDTO } from '../dto/request/command/update-tag.command.dto.js';
import { DeleteTagCommandDTO } from '../dto/request/command/delete-tag.command.dto.js';
import {
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  DeleteTagResponseDTO,
} from '../dto/response/event-responses.dto.js';

@ApiTags('Tags')
@Controller('tags')
export class TagCommandController implements OnModuleInit {
  private tagService!: TagCommandServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.tagService = this.client.getService<TagCommandServiceClient>(
      TAG_COMMAND_SERVICE_NAME,
    );
  }

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, type: CreateTagResponseDTO })
  @Post()
  createTag(@Body() command: CreateTagCommandDTO) {
    return this.tagService.createTag(command.toCommand());
  }

  @ApiOperation({ summary: 'Update a tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({ status: 200, type: UpdateTagResponseDTO })
  @Patch(':id')
  updateTag(@Param('id') id: string, @Body() command: UpdateTagCommandDTO) {
    return this.tagService.updateTag({ ...command.toCommand(), id });
  }

  @ApiOperation({ summary: 'Delete a tag by ID' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({ status: 200, type: DeleteTagResponseDTO })
  @Delete(':id')
  deleteTag(@Param('id') id: string) {
    const cmd = new DeleteTagCommandDTO();
    cmd.id = id;
    return this.tagService.deleteTag(cmd.toCommand());
  }
}

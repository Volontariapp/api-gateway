import { Body, Controller, Delete, Param, Patch, Post, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import type { Metadata } from '@grpc/grpc-js';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiConflictResponse } from '@volontariapp/errors-nest';
import { Roles } from '@volontariapp/auth';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import { CreateTagRequestDTO, UpdateTagRequestDTO } from '../../../dto/request/index.js';
import {
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  ActionSuccessResponseDTO,
} from '../../../dto/response/index.js';
import { DeleteTagCommand } from '@volontariapp/contracts-nest';
import { BaseTagGrpcController } from '../../base-grpc.controller.js';

@GatewayController('Tags - Admin', {
  admin: true,
  extraModels: [CreateTagResponseDTO, UpdateTagResponseDTO, ActionSuccessResponseDTO],
})
@Controller('tags')
export class TagAdminCommandController extends BaseTagGrpcController {
  private readonly logger = new Logger({
    context: TagAdminCommandController.name,
  });

  @Post()
  @Roles(UserRoles.ADMIN)
  @ApiOperation({
    summary: 'Create a new tag',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nCreate a new event tag for categorizing and filtering events. Each tag must have a unique label.',
  })
  @ApiResponse({
    status: 201,
    type: CreateTagResponseDTO,
  })
  @ApiConflictResponse('A tag with this label already exists')
  createTag(@Body() request: CreateTagRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Creating tag');
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.createTag(request.toCommand(), metadata);
  }

  @Patch(':id')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({
    summary: 'Update a tag by ID',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nModify tag properties such as label, description, or color.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({
    status: 200,
    type: UpdateTagResponseDTO,
  })
  updateTag(
    @Param('id') id: string,
    @Body() request: UpdateTagRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    this.logger.log(`Updating tag with id: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.updateTag(request.toCommand(), metadata);
  }

  @Delete(':id')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({
    summary: 'Delete a tag by ID',
    description:
      '🔐 **Required Role:** `ADMIN`\n\nRemove a tag from the system. Events previously tagged with this tag will no longer have it.',
  })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  deleteTag(@Param('id') id: string, @Req() req: Record<string, unknown>) {
    this.logger.log(`Deleting tag with id: ${id}`);
    const command: DeleteTagCommand = { id };
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService.deleteTag(command, metadata);
  }
}

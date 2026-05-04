import { Body, Controller, Delete, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import type { Metadata } from '@grpc/grpc-js';
import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@volontariapp/errors-nest';
import { AccessTokenGuard, RolesGuard, Roles } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import { CreateTagRequestDTO, UpdateTagRequestDTO } from '../../dto/request/index.js';
import {
  CreateTagResponseDTO,
  UpdateTagResponseDTO,
  ActionSuccessResponseDTO,
} from '../../dto/response/index.js';
import { DeleteTagCommand } from '@volontariapp/contracts-nest';
import { BaseTagGrpcController } from '../base-grpc.controller.js';

@ApiTags('Tags - Admin')
@ApiExtraModels(CreateTagResponseDTO, UpdateTagResponseDTO, ActionSuccessResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('Required role: ADMIN — your token does not grant this access')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('tags')
@UseGuards(AccessTokenGuard, RolesGuard)
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

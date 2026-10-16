import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { CustomApiError, FILE_NOT_FOUND } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { map, Observable } from 'rxjs';

import { BaseStorageGrpcController } from '../base-grpc.controller.js';
import { GatewayController } from '../../../../common/decorators/gateway-controller.decorator.js';
import { GenerateUploadUrlRequestDTO, ConfirmUploadRequestDTO } from '../../dto/request/index.js';
import {
  ConfirmUploadResponseDTO,
  GenerateUploadUrlResponseDTO,
} from '../../dto/response/index.js';
import { mapStorageUnavailable, withStorageDeadline } from '../../common/storage-grpc-errors.js';

@ApiExtraModels(GenerateUploadUrlResponseDTO, ConfirmUploadResponseDTO)
@GatewayController('Storage')
@Controller('storage')
export class StorageCommandController extends BaseStorageGrpcController {
  private readonly logger = new Logger({ context: StorageCommandController.name });

  @ApiOperation({
    summary: 'Declare a file and get a presigned upload POST',
    description:
      'The file goes straight to the quarantine bucket. The owner is taken from the access token.',
  })
  @ApiResponse({ status: 201, type: GenerateUploadUrlResponseDTO })
  @ApiResponse({ status: 400, description: 'MIME type, size or entity type not allowed' })
  @ApiResponse({ status: 503, description: 'Storage service unavailable' })
  @Post('upload-url')
  generateUploadUrl(
    @CurrentUser() user: AuthUser,
    @Body() request: GenerateUploadUrlRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<GenerateUploadUrlResponseDTO> {
    this.logger.log(
      `Generating upload URL for user ${user.id}, entity type ${String(request.entityType)}`,
    );
    const metadata = req['internalMetadata'] as Metadata;
    return this.storageService.generateUploadUrl(request.toCommand(), metadata).pipe(
      mapStorageUnavailable(),
      map((res) => GenerateUploadUrlResponseDTO.fromResponse(res)),
    );
  }

  @ApiOperation({
    summary: 'Confirm that a file has been uploaded',
    description:
      'Starts the scan. Returns SCANNING (async) or the final state (sync). Idempotent. Deadline: 10 s.',
  })
  @ApiParam({ name: 'id', example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  @ApiResponse({ status: 200, type: ConfirmUploadResponseDTO })
  @ApiResponse({
    status: 422,
    description: 'Upload expired, object missing from quarantine, or file rejected (with reason)',
  })
  @ApiResponse({ status: 503, description: 'Storage service unavailable or deadline exceeded' })
  @CustomApiError(() => FILE_NOT_FOUND('id'))
  @HttpCode(HttpStatus.OK)
  @Post('files/:id/confirm')
  confirmUpload(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Record<string, unknown>,
  ): Observable<ConfirmUploadResponseDTO> {
    this.logger.log(`Confirming upload of file ${id} for user ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    const request = new ConfirmUploadRequestDTO();
    request.fileId = id;
    return this.storageService.confirmUpload(request.toCommand(), metadata).pipe(
      withStorageDeadline(),
      map((res) => ConfirmUploadResponseDTO.fromResponse(res)),
    );
  }
}

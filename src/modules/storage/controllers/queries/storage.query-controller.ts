import { Controller, Get, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
import { Logger } from '@volontariapp/logger';
import { CustomApiError, FILE_NOT_FOUND } from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';
import { map, Observable } from 'rxjs';

import { BaseStorageGrpcController } from '../base-grpc.controller.js';
import { GatewayController } from '../../../../common/decorators/gateway-controller.decorator.js';
import { GetFileMetadataRequestDTO } from '../../dto/request/index.js';
import { GetFileMetadataResponseDTO } from '../../dto/response/index.js';
import { mapStorageUnavailable } from '../../common/storage-grpc-errors.js';

@ApiExtraModels(GetFileMetadataResponseDTO)
@GatewayController('Storage')
@Controller('storage')
export class StorageQueryController extends BaseStorageGrpcController {
  private readonly logger = new Logger({ context: StorageQueryController.name });

  @ApiOperation({
    summary: 'Get the metadata of a file',
    description:
      'Only the owner can read a file. The public URL is set only when the scan is CLEAN.',
  })
  @ApiParam({ name: 'id', example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  @ApiResponse({ status: 200, type: GetFileMetadataResponseDTO })
  @ApiResponse({ status: 503, description: 'Storage service unavailable' })
  @CustomApiError(() => FILE_NOT_FOUND('id'))
  @Get('files/:id')
  getFileMetadata(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Record<string, unknown>,
  ): Observable<GetFileMetadataResponseDTO> {
    this.logger.log(`Getting metadata of file ${id} for user ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    const request = new GetFileMetadataRequestDTO();
    request.fileId = id;
    return this.storageService.getFileMetadata(request.toQuery(), metadata).pipe(
      mapStorageUnavailable(),
      map((res) => GetFileMetadataResponseDTO.fromResponse(res)),
    );
  }
}

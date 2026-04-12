import type { ClientsModuleAsyncOptions } from '@nestjs/microservices';
import {
  GRPC_MICROSERVICES,
  getGrpcOptions,
} from '@volontariapp/contracts-nest';
import { AppConfigService } from '../config/app-config.service.js';
import { EVENT_PACKAGE, POST_PACKAGE, USER_PACKAGE } from './grpc-packages.js';

export const grpcClientOptions: ClientsModuleAsyncOptions = [
  {
    name: USER_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(
        GRPC_MICROSERVICES.USER,
        configService.config.microServices.msUserUrl,
      ),
  },
  {
    name: POST_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(
        GRPC_MICROSERVICES.POST,
        configService.config.microServices.msPostUrl,
      ),
  },
  {
    name: EVENT_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(
        GRPC_MICROSERVICES.EVENT,
        configService.config.microServices.msEventUrl,
      ),
  },
];

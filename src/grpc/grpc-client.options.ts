import type { ClientsModuleAsyncOptions } from '@nestjs/microservices';
import { GRPC_SERVICES, getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from '../config/app-config.service.js';
import { EVENT_PACKAGE, POST_PACKAGE, USER_PACKAGE } from './grpc-packages.js';

export const grpcClientOptions: ClientsModuleAsyncOptions = [
  {
    name: USER_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(GRPC_SERVICES.USER, configService.msUserUrl),
  },
  {
    name: POST_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(GRPC_SERVICES.POST, configService.msPostUrl),
  },
  {
    name: EVENT_PACKAGE,
    inject: [AppConfigService],
    useFactory: (configService: AppConfigService) =>
      getGrpcOptions(GRPC_SERVICES.EVENT, configService.msEventUrl),
  },
];

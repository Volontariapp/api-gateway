import { Logger } from '@nestjs/common';
import { jest } from '@jest/globals';

export const setupNestLoggerMock = (): void => {
  jest
    .spyOn(Logger.prototype, 'log')
    .mockImplementation((..._args: Parameters<Logger['log']>) => undefined);
  jest
    .spyOn(Logger.prototype, 'warn')
    .mockImplementation((..._args: Parameters<Logger['warn']>) => undefined);
  jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation((..._args: Parameters<Logger['error']>) => undefined);
  jest
    .spyOn(Logger.prototype, 'debug')
    .mockImplementation((..._args: Parameters<Logger['debug']>) => undefined);
  jest
    .spyOn(Logger.prototype, 'verbose')
    .mockImplementation((..._args: Parameters<Logger['verbose']>) => undefined);
  jest
    .spyOn(Logger.prototype, 'fatal')
    .mockImplementation((..._args: Parameters<Logger['fatal']>) => undefined);
};

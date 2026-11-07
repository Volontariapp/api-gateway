import { jest } from '@jest/globals';
import { Logger } from '@volontariapp/logger';

/** Silences @volontariapp/logger (the gateway services use it, unlike the Nest logger). */
export const setupVolontariappLoggerMock = (): void => {
  for (const level of ['log', 'info', 'debug', 'warn', 'error', 'verbose', 'fatal'] as const) {
    jest.spyOn(Logger.prototype, level).mockImplementation(() => undefined);
  }
};

import type { ArgumentsHost } from '@nestjs/common';

export const createArgumentsHost = (
  requestMock: unknown,
  responseMock: unknown,
): ArgumentsHost => {
  return {
    switchToHttp: () => ({
      getRequest: () => requestMock,
      getResponse: () => responseMock,
      getNext: () => {},
    }),
    getArgs: () => {},
    getArgByIndex: () => {},
    switchToRpc: () => {},
    switchToWs: () => {},
    getType: () => {},
  } as unknown as ArgumentsHost;
};

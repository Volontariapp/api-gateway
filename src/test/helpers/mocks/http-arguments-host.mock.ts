import type { ArgumentsHost } from '@nestjs/common';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import {
  createMock,
  createMockRequest,
  createMockResponse,
  type MockResponse,
} from '@volontariapp/testing';

/** HTTP host whose response records the status and body written by an exception filter. */
export const createHttpArgumentsHostMock = (
  url: string = '/events',
): { host: ArgumentsHost; response: MockResponse } => {
  const request = createMockRequest({ url });
  const response = createMockResponse();
  const http = createMock<HttpArgumentsHost>();
  http.getRequest.mockReturnValue(request);
  http.getResponse.mockReturnValue(response);
  const host = createMock<ArgumentsHost>();
  host.getType.mockReturnValue('http');
  host.switchToHttp.mockReturnValue(http);
  return { host, response };
};

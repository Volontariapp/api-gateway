import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { GrpcToHttpExceptionFilter } from '../grpc-to-http-exception.filter.js';
import { createArgumentsHost } from './arguments-host.factory.js';
import { HttpException, HttpStatus } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import type { Request, Response } from 'express';

describe('GrpcToHttpExceptionFilter', () => {
  let filter: GrpcToHttpExceptionFilter;
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    filter = new GrpcToHttpExceptionFilter();
    mockRequest = { url: '/test-url' } as unknown as Request;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should map gRPC NOT_FOUND to HTTP 404', () => {
    const host = createArgumentsHost(mockRequest, mockResponse);
    const exception = { code: status.NOT_FOUND, message: 'Resource missing' };
    const statusSpy = jest.spyOn(mockResponse, 'status');
    const jsonSpy = jest.spyOn(mockResponse, 'json');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonSpy).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Resource missing',
      timestamp: expect.any(String) as unknown,
      path: '/test-url',
      grpcCode: status.NOT_FOUND,
    });
  });

  it('should handle standard HttpException', () => {
    const host = createArgumentsHost(mockRequest, mockResponse);
    const exception = new HttpException(
      'Forbidden access',
      HttpStatus.FORBIDDEN,
    );
    const statusSpy = jest.spyOn(mockResponse, 'status');
    const jsonSpy = jest.spyOn(mockResponse, 'json');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(jsonSpy).toHaveBeenCalledWith({
      message: 'Forbidden access',
      statusCode: HttpStatus.FORBIDDEN,
      timestamp: expect.any(String) as unknown,
      path: '/test-url',
    });
  });

  it('should handle standard Error fallback', () => {
    const host = createArgumentsHost(mockRequest, mockResponse);
    const exception = new Error('Unexpected crash');
    const statusSpy = jest.spyOn(mockResponse, 'status');
    const jsonSpy = jest.spyOn(mockResponse, 'json');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonSpy).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unexpected crash',
      timestamp: expect.any(String) as unknown,
      path: '/test-url',
    });
  });
});

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { HttpExceptionFilter } from '../http-exception.filter.js';
import { createArgumentsHost } from './arguments-host.factory.js';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockRequest = { url: '/api/test' } as unknown as Request;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should format string response from HttpException', () => {
    const host = createArgumentsHost(mockRequest, mockResponse);
    const exception = new HttpException('Simple error', HttpStatus.BAD_REQUEST);
    const statusSpy = jest.spyOn(mockResponse, 'status');
    const jsonSpy = jest.spyOn(mockResponse, 'json');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonSpy).toHaveBeenCalledWith({
      message: 'Simple error',
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String) as unknown,
      path: '/api/test',
    });
  });

  it('should format object response from HttpException', () => {
    const host = createArgumentsHost(mockRequest, mockResponse);
    const exceptionResponse = {
      error: 'Bad Request',
      message: ['Invalid email'],
    };
    const exception = new HttpException(
      exceptionResponse,
      HttpStatus.BAD_REQUEST,
    );
    const statusSpy = jest.spyOn(mockResponse, 'status');
    const jsonSpy = jest.spyOn(mockResponse, 'json');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: ['Invalid email'],
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String) as unknown,
      path: '/api/test',
    });
  });
});

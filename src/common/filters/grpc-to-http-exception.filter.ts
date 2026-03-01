import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import type { Request, Response } from 'express';

interface GrpcException {
  code: number;
  message?: string;
  details?: string;
}

@Catch()
export class GrpcToHttpExceptionFilter implements ExceptionFilter<unknown> {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const grpcException = exception as GrpcException | undefined | null;

    if (
      grpcException !== null &&
      grpcException !== undefined &&
      typeof grpcException.code === 'number' &&
      Object.values(status).includes(grpcException.code)
    ) {
      const httpStatus = this.mapGrpcStatusToHttpStatus(grpcException.code);
      const message =
        grpcException.details ??
        grpcException.message ??
        'Internal server error';

      return response.status(httpStatus).json({
        statusCode: httpStatus,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        grpcCode: grpcException.code,
      });
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const responseData = exception.getResponse();

      return response.status(statusCode).json({
        ...(typeof responseData === 'object'
          ? responseData
          : { message: responseData }),
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let fallbackMessage = 'Internal server error';
    if (exception instanceof Error) {
      fallbackMessage = exception.message;
    } else if (typeof exception === 'string') {
      fallbackMessage = exception;
    }

    return response.status(statusCode).json({
      statusCode,
      message: fallbackMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapGrpcStatusToHttpStatus(grpcStatus: number): number {
    switch (grpcStatus as status) {
      case status.OK:
        return HttpStatus.OK;
      case status.CANCELLED:
        return 499;
      case status.UNKNOWN:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case status.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.GATEWAY_TIMEOUT;
      case status.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case status.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case status.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      case status.RESOURCE_EXHAUSTED:
        return HttpStatus.TOO_MANY_REQUESTS;
      case status.FAILED_PRECONDITION:
        return HttpStatus.BAD_REQUEST;
      case status.ABORTED:
        return HttpStatus.CONFLICT;
      case status.OUT_OF_RANGE:
        return HttpStatus.PAYLOAD_TOO_LARGE;
      case status.UNIMPLEMENTED:
        return HttpStatus.NOT_IMPLEMENTED;
      case status.INTERNAL:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case status.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case status.DATA_LOSS:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case status.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}

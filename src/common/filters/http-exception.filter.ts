import {
  Catch,
  Logger,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponseDto } from '@common/dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<any>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Galat di server';
    let fields: Record<string, string> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        code = resObj.code || this.getDefaultCodeForStatus(status);
        message = resObj.message || exception.message;
        fields = resObj.fields;

        // If class-validator default message array is returned
        if (Array.isArray(resObj.message) && !fields) {
          fields = {};
          message = 'Isian tidak lolos validasi';
          resObj.message.forEach((msg: string) => {
            const fieldName = msg.split(' ')[0] || 'general';
            fields[fieldName] = msg;
          });
        }
      } else {
        message = String(exceptionResponse);
        code = this.getDefaultCodeForStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Only include fields property if status is 422 or fields exists (as per integration guide Hal 4)
    if (status !== HttpStatus.UNPROCESSABLE_ENTITY && !fields) {
      fields = undefined;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Code: ${code} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorBody: ApiErrorResponseDto = {
      success: false,
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    };

    response.status(status).json(errorBody);
  }

  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHENTICATED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}

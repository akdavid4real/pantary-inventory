import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientInitializationError, Prisma.PrismaClientKnownRequestError)
export class PrismaAvailabilityFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientInitializationError | Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const retryableCodes = new Set(['P1001', 'P1002', 'P1017', 'P2024', 'P2028']);

    if (exception instanceof Prisma.PrismaClientKnownRequestError && !retryableCodes.has(exception.code)) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'A database request could not be completed.',
        retryable: false,
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'The kitchen data service is temporarily unavailable. Please retry.',
      retryable: true,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

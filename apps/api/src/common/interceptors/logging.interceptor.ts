import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const start = Date.now();

    const requestId = request.headers['x-request-id'];

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.logger.log(
          `${request.method} ${request.originalUrl} ` +
          `requestId=${requestId} ` +
          `status=${response.statusCode} ` +
          `duration=${duration}ms`,
        );
      }),
    );
  }
}
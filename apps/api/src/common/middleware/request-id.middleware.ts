import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    const requestId = randomUUID();

    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    next();
  }
}
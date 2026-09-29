import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import { RedisService } from '../redis/redis.service.js';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  services?: {
    mongodb: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection()
    private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
  ) {}

  getLiveness(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<HealthCheckResult> {
    const mongodbUp =
      this.mongoConnection.readyState === 1;

    const redisUp =
      await this.redisService.isAvailable();

    const result: HealthCheckResult = {
      status:
        mongodbUp && redisUp
          ? 'ok'
          : 'error',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongodbUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };

    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RedisModule } from '../redis/redis.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [
    MongooseModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
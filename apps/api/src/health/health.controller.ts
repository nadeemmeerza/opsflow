import { Controller, Get } from '@nestjs/common';

import type { HealthCheckResult } from './health.service.js';

import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness endpoint.
   *
   * Docker/Kubernetes can use this to determine whether
   * the application process itself is alive.
   */
  @Get('live')
  getLiveness(): HealthCheckResult {
    return this.healthService.getLiveness();
  }

  /**
   * Readiness endpoint.
   *
   * This verifies that the API can communicate with the
   * dependencies required to serve normal application traffic.
   */
  @Get('ready')
  async getReadiness(): Promise<HealthCheckResult> {
    return this.healthService.getReadiness();
  }
}

import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

/**
 * Dashboard endpoints are scoped to an organization.
 *
 * Both authentication and organization membership are required:
 *
 * 1. JwtAuthGuard verifies that the request contains a valid JWT.
 * 2. OrganizationMembershipGuard verifies that the authenticated
 *    user belongs to the requested organization.
 *
 * This prevents users from requesting dashboard statistics for
 * organizations they are not members of.
 */
@Controller(
  'organizations/:organizationId/dashboard',
)
@UseGuards(
  JwtAuthGuard,
  OrganizationMembershipGuard,
)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  /**
   * Returns aggregated operational statistics for one organization.
   *
   * The controller deliberately contains no business calculations.
   * Those calculations belong in DashboardService.
   */
  @Get()
  async getDashboard(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.dashboardService.getDashboard(
      organizationId,
    );
  }
}
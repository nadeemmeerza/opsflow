import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AuditService } from './audit.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

import { RolesGuard } from '../common/guards/roles.guard.js';

import { Roles } from '../common/decorators/roles.decorator.js';

@Controller(
  'organizations/:organizationId/audit-logs',
)
@UseGuards(
  JwtAuthGuard,
  OrganizationMembershipGuard,
  RolesGuard,
)
export class AuditController {
  constructor(
    private readonly auditService:
      AuditService,
  ) {}

  @Get()
  @Roles('owner', 'admin')
  async findAll(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.auditService.findAll(
      organizationId,
    );
  }

  @Get(
    ':entity/:entityId',
  )
  @Roles('owner', 'admin')
  async findByEntity(
    @Param('organizationId')
    organizationId: string,

    @Param('entity')
    entity: string,

    @Param('entityId')
    entityId: string,
  ) {
    return this.auditService.findByEntity(
      organizationId,
      entity,
      entityId,
    );
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { OrganizationQueryDto } from './dto/organization-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

import { ParseObjectIdPipe } from '@nestjs/mongoose';

/**
 * Organization endpoints use authentication for the collection-level
 * operations and membership + role authorization for an existing
 * organization.
 *
 * GET /organizations/:organizationId is intentionally available to every
 * organization member, while update/delete are restricted to the owner.
 * The membership guard supplies the organization role before RolesGuard
 * evaluates the @Roles metadata.
 */
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationService: OrganizationsService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.create(
      dto.name,
      dto.slug,
      user.userId,
    );
  }

  /**
   * Returns every organization in which the authenticated user is a member.
   * Query parameters control search, filtering, sorting, and pagination.
   */
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationQueryDto,
  ) {
    return this.organizationService.findAll(
      user.userId,
      query,
    );
  }

  @Get('test-error')
  testError() {
    throw new NotFoundException(
      'Test organization not found',
    );
  }

  /**
   * Viewing an organization requires membership, but not a privileged role.
   */
  @Get(':organizationId')
  @UseGuards(OrganizationMembershipGuard)
  async findOne(
    @Param('organizationId', ParseObjectIdPipe)
    organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.findOne(
      organizationId,
      user.userId,
    );
  }

  /**
   * Organization settings are owner-only. Membership is checked first so
   * RolesGuard can safely evaluate the role attached to the request.
   */
  @Patch(':organizationId')
  @UseGuards(OrganizationMembershipGuard, RolesGuard)
  @Roles('owner')
  async update(
    @Param('organizationId', ParseObjectIdPipe)
    organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.update(
      organizationId,
      user.userId,
      dto,
    );
  }

  /**
   * Organization deletion is owner-only and remains additionally scoped by
   * ownerId in the service as a defense-in-depth check.
   */
  @Delete(':organizationId')
  @UseGuards(OrganizationMembershipGuard, RolesGuard)
  @Roles('owner')
  async remove(
    @Param('organizationId', ParseObjectIdPipe)
    organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationService.remove(
      organizationId,
      user.userId,
    );
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';

import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import { OrganizationMembersService } from './organization-members.service.js';
import { OrganizationMembershipGuard } from './guards/organization-membership.guard.js';

import { AddMemberDto } from './dto/add-member.dto.js';
import { MemberQueryDto } from './dto/member-query.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

/**
 * Organization member management API.
 *
 * Authentication and organization membership are required
 * for every endpoint.
 *
 * Write operations additionally use RolesGuard so that only
 * organization owners and admins can modify membership.
 */
@UseGuards(
  JwtAuthGuard,
  OrganizationMembershipGuard,
  RolesGuard,
)
@Controller('organizations/:organizationId/members')
export class OrganizationMembersController {
  constructor(
    private readonly membersService: OrganizationMembersService,
  ) {}

  /**
   * Returns organization members.
   *
   * Members can search, filter by role, sort, and paginate
   * the result. The service performs the actual query logic.
   */
  @Get()
  async findAll(
    @Param(
      'organizationId',
      ParseObjectIdPipe,
    )
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query: MemberQueryDto,
  ) {
    return this.membersService.findAll(
      organizationId,
      user.userId,
      query,
    );
  }

  /**
   * Adds an existing OpsFlow user to the organization.
   *
   * The user must already have an account. Only owners
   * and admins are allowed to perform this operation.
   */
  @Post()
  @Roles('owner', 'admin')
  async addMember(
    @Param(
      'organizationId',
      ParseObjectIdPipe,
    )
    organizationId: string,

    @Body()
    dto: AddMemberDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.membersService.addMember(
      organizationId,
      user.userId,
      dto.email,
      dto.role,
    );
  }

  /**
   * Changes an existing member's role.
   *
   * The DTO only permits "admin" or "member".
   * The service separately protects the organization owner
   * from having their role changed.
   */
  @Patch(':memberId/role')
  @Roles('owner', 'admin')
  async updateMemberRole(
    @Param(
      'organizationId',
      ParseObjectIdPipe,
    )
    organizationId: string,

    @Param(
      'memberId',
      ParseObjectIdPipe,
    )
    memberId: string,

    @Body()
    dto: UpdateMemberRoleDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.membersService.updateMemberRole(
      organizationId,
      user.userId,
      memberId,
      dto.role,
    );
  }

  /**
   * Removes a member from the organization.
   *
   * Only owners and admins can perform the operation.
   * The service prevents the organization owner from
   * being removed.
   */
  @Delete(':memberId')
  @Roles('owner', 'admin')
  async removeMember(
    @Param(
      'organizationId',
      ParseObjectIdPipe,
    )
    organizationId: string,

    @Param(
      'memberId',
      ParseObjectIdPipe,
    )
    memberId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.membersService.removeMember(
      organizationId,
      user.userId,
      memberId,
    );
  }
}
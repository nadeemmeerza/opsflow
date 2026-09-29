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

import { ProjectsService } from './projects.service.js';

import {  ProjectQueryDto, CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
// import { ProjectQueryDto } from './dto/project-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';

import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

@UseGuards(
  JwtAuthGuard,
  OrganizationMembershipGuard,
  RolesGuard,
)
@Controller(
  'organizations/:organizationId/projects',
)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateProjectDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.projectsService.create(
      organizationId,
      user.userId,
      dto,
    );
  }

  /**
   * The query DTO gives the endpoint support for:
   * search, status filtering, sorting and pagination.
   */
  @Get()
  async findAll(
    @Param('organizationId')
    organizationId: string,

    @Query()
    query: ProjectQueryDto,
  ) {
    return this.projectsService.findAll(
      organizationId,
      query,
    );
  }

  @Get(':projectId')
  async findOne(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,
  ) {
    return this.projectsService.findOne(
      organizationId,
      projectId,
    );
  }

  @Patch(':projectId')
  @Roles('owner', 'admin')
  async update(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Body()
    dto: UpdateProjectDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.projectsService.update(
      organizationId,
      projectId,
      user.userId,
      dto,
    );
  }

  @Delete(':projectId')
  @Roles('owner')
  async remove(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.projectsService.remove(
      organizationId,
      projectId,
      user.userId,
    );
  }
}
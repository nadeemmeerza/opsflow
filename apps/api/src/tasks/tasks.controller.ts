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

import { TasksService } from './tasks.service.js';

import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

import { RolesGuard } from '../common/guards/roles.guard.js';

import { Roles } from '../common/decorators/roles.decorator.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { TaskQueryDto } from './dto/task-query.dto.js';

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard, RolesGuard)
@Controller('organizations/:organizationId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Body()
    dto: CreateTaskDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.tasksService.create(
      organizationId,
      projectId,
      user.userId,
      dto,
    );
  }

  /**
   * Returns tasks for the selected project with optional
   * search, filtering, sorting, and pagination.
   */
  @Get()
  async findAll(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Query()
    query: TaskQueryDto,
  ) {
    return this.tasksService.findAll(organizationId, projectId, query);
  }

  @Get(':taskId')
  async findOne(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Param('taskId')
    taskId: string,
  ) {
    return this.tasksService.findOne(organizationId, projectId, taskId);
  }

  @Patch(':taskId')
  @Roles('owner', 'admin')
  async update(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Param('taskId')
    taskId: string,

    @Body()
    dto: UpdateTaskDto,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(
      organizationId,
      projectId,
      taskId,
      user.userId,
      dto,
    );
  }

  @Delete(':taskId')
  @Roles('owner')
  async remove(
    @Param('organizationId')
    organizationId: string,

    @Param('projectId')
    projectId: string,

    @Param('taskId')
    taskId: string,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.remove(
      organizationId,
      projectId,
      taskId,
      user.userId,
    );
  }
}

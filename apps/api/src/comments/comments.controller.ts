import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CommentsService } from './comments.service.js';

import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

type OrganizationRequest = Request & {
  organizationRole: string;
};

@Controller('organizations/:organizationId/comments')
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateCommentDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.commentsService.create(organizationId, user.userId, dto);
  }

  @Get('ticket/:ticketId')
  async findByTicket(
    @Param('organizationId')
    organizationId: string,

    @Param('ticketId')
    ticketId: string,
  ) {
    return this.commentsService.findByTicket(organizationId, ticketId);
  }

  @Get('task/:taskId')
  async findByTask(
    @Param('organizationId')
    organizationId: string,

    @Param('taskId')
    taskId: string,
  ) {
    return this.commentsService.findByTask(organizationId, taskId);
  }

  @Get(':commentId')
  async findOne(
    @Param('organizationId')
    organizationId: string,

    @Param('commentId')
    commentId: string,
  ) {
    return this.commentsService.findOne(organizationId, commentId);
  }

  @Patch(':commentId')
  @Roles('owner', 'admin')
  async update(
    @Param('organizationId')
    organizationId: string,

    @Param('commentId')
    commentId: string,

    @Body()
    dto: UpdateCommentDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.commentsService.update(
      organizationId,
      commentId,
      user.userId,
      dto.content,
    );
  }

  @Delete(':commentId')
  @Roles('owner', 'admin')
  async remove(
    @Param('organizationId')
    organizationId: string,

    @Param('commentId')
    commentId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Req()
    request: OrganizationRequest,
  ) {
    return this.commentsService.remove(
      organizationId,
      commentId,
      user.userId,
      request.organizationRole,
    );
  }
}

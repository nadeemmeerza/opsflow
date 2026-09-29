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

import { TicketsService } from './tickets.service.js';

import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { TicketQueryDto } from './dto/ticket-query.dto.js';

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard, RolesGuard)
@Controller('organizations/:organizationId/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateTicketDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.ticketsService.create(organizationId, user.userId, dto);
  }

  @Get()
  async findAll(
    @Param('organizationId')
    organizationId: string,

    @Query()
    query: TicketQueryDto,
  ) {
    return this.ticketsService.findAll(organizationId, query);
  }

  @Get(':ticketId')
  async findOne(
    @Param('organizationId')
    organizationId: string,

    @Param('ticketId')
    ticketId: string,
  ) {
    return this.ticketsService.findOne(organizationId, ticketId);
  }

  @Patch(':ticketId')
  @Roles('owner', 'admin')
  async update(
    @Param('organizationId')
    organizationId: string,

    @Param('ticketId')
    ticketId: string,

    @Body()
    dto: UpdateTicketDto,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.update(
      organizationId,
      ticketId,
      user.userId,
      dto,
    );
  }

  @Delete(':ticketId')
  @Roles('owner')
  async remove(
    @Param('organizationId')
    organizationId: string,

    @Param('ticketId')
    ticketId: string,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.remove(organizationId, ticketId, user.userId);
  }
}

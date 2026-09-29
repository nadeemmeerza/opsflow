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

import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';

import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CustomerQueryDto } from './dto/customer-query.dto.js';

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard, RolesGuard)
@Controller('organizations/:organizationId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: CreateCustomerDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.customersService.create(organizationId, user.userId, dto);
  }

  @Get()
  async findAll(
    @Param('organizationId')
    organizationId: string,

    @Query()
    query: CustomerQueryDto,
  ) {
    return this.customersService.findAll(organizationId, query);
  }

  @Get(':customerId')
  async findOne(
    @Param('organizationId')
    organizationId: string,

    @Param('customerId')
    customerId: string,
  ) {
    return this.customersService.findOne(organizationId, customerId);
  }

  @Patch(':customerId')
  @Roles('owner', 'admin')
  async update(
    @Param('organizationId')
    organizationId: string,

    @Param('customerId')
    customerId: string,

    @Body()
    dto: UpdateCustomerDto,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.update(
      organizationId,
      customerId,
      user.userId,
      dto,
    );
  }

  @Delete(':customerId')
  @Roles('owner')
  async remove(
    @Param('organizationId')
    organizationId: string,

    @Param('customerId')
    customerId: string,

    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.remove(
      organizationId,
      customerId,
      user.userId,
    );
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema.js';

import {
  Task,
  TaskSchema,
} from '../tasks/schemas/task.schema.js';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema.js';

import {
  Ticket,
  TicketSchema,
} from '../tickets/schemas/ticket.schema.js';

import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

import { AuthModule } from '../auth/auth.module.js';

import {
  OrganizationMembersModule,
} from '../organization-members/organization-members.module.js';

/**
 * DashboardModule provides the organization dashboard endpoint.
 *
 * It imports the modules required by the authentication and
 * organization-membership guards and registers the four
 * MongoDB models required to calculate dashboard statistics.
 */
@Module({
  imports: [
    /**
     * Required by JwtAuthGuard.
     */
    AuthModule,

    /**
     * Provides OrganizationMembershipGuard and its
     * membership-related dependencies.
     */
    OrganizationMembersModule,

    /**
     * DashboardService reads these collections to calculate
     * organization-level statistics.
     */
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },

      {
        name: Task.name,
        schema: TaskSchema,
      },

      {
        name: Customer.name,
        schema: CustomerSchema,
      },

      {
        name: Ticket.name,
        schema: TicketSchema,
      },
    ]),
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],
})
export class DashboardModule {}

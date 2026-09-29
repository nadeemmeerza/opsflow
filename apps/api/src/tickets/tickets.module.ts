import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Ticket,
  TicketSchema,
} from './schemas/ticket.schema.js';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema.js';

import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema.js';

import {
  OrganizationMember,
  OrganizationMemberSchema,
} from '../organization-members/schemas/organization-member.schema.js';

import { TicketsService } from './tickets.service.js';
import { TicketsController } from './tickets.controller.js';

import { AuthModule } from '../auth/auth.module.js';

import { OrganizationMembersModule } from '../organization-members/organization-members.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    AuditModule,
    AuthModule,

    OrganizationMembersModule,

    MongooseModule.forFeature([
      {
        name: Ticket.name,
        schema: TicketSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: OrganizationMember.name,
        schema: OrganizationMemberSchema,
      },
    ]),
  ],

  controllers: [
    TicketsController,
  ],

  providers: [
    TicketsService,
  ],
})
export class TicketsModule {}

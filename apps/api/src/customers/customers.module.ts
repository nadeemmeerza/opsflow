import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Customer,
  CustomerSchema,
} from './schemas/customer.schema.js';

import { CustomersService } from './customers.service.js';
import { CustomersController } from './customers.controller.js';

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
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],

  controllers: [
    CustomersController,
  ],

  providers: [
    CustomersService,
  ],
})
export class CustomersModule {}

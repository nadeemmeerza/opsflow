import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AuditLog,
  AuditLogSchema,
} from './schemas/audit-log.schema.js';

import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';

import { AuthModule } from '../auth/auth.module.js';

import { OrganizationMembersModule } from '../organization-members/organization-members.module.js';

@Module({
  imports: [
    AuthModule,

     forwardRef(() => OrganizationMembersModule),

    MongooseModule.forFeature([
      {
        name: AuditLog.name,
        schema: AuditLogSchema,
      },
    ]),
  ],

  controllers: [
    AuditController,
  ],

  providers: [
    AuditService,
  ],

  exports: [
    AuditService,
  ],
})
export class AuditModule {}

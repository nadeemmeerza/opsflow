import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  OrganizationMember,
  OrganizationMemberSchema,
} from './schemas/organization-member.schema.js';

import { OrganizationMembersService } from './organization-members.service.js';
import { OrganizationMembersController } from './organization-members.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { OrganizationMembershipGuard } from './guards/organization-membership.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
      forwardRef(() => AuditModule),
    AuthModule,
    MongooseModule.forFeature([
      {
        name: OrganizationMember.name,
        schema: OrganizationMemberSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [OrganizationMembersController],
  providers: [
    OrganizationMembersService,
    OrganizationMembershipGuard,
    RolesGuard,
  ],
  exports: [
    MongooseModule,
    OrganizationMembersService,
    OrganizationMembershipGuard,
    RolesGuard,
  ],
})
export class OrganizationMembersModule {}

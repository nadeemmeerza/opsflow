import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  Project,
  ProjectSchema,
} from './schemas/project.schema.js';

import { ProjectsService } from './projects.service.js';
import { ProjectsController } from './projects.controller.js';

import { OrganizationMembersModule } from '../organization-members/organization-members.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Project.name,
        schema: ProjectSchema,
      },
    ]),

    OrganizationMembersModule,
  ],

  controllers: [
    ProjectsController,
  ],

  providers: [
    ProjectsService,
  ],
})
export class ProjectsModule {}

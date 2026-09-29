import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  Task,
  TaskSchema,
} from './schemas/task.schema.js';

import {
  Project,
  ProjectSchema,
} from '../projects/schemas/project.schema.js';

import {
  OrganizationMember,
  OrganizationMemberSchema,
} from '../organization-members/schemas/organization-member.schema.js';

import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';

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
        name: Task.name,
        schema: TaskSchema,
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
    TasksController,
  ],

  providers: [
    TasksService,
  ],
})
export class TasksModule {}
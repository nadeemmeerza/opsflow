import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Comment,
  CommentSchema,
} from './schemas/comment.schema.js';

import {
  Ticket,
  TicketSchema,
} from '../tickets/schemas/ticket.schema.js';

import {
  Task,
  TaskSchema,
} from '../tasks/schemas/task.schema.js';

import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';

import { AuthModule } from '../auth/auth.module.js';

import { OrganizationMembersModule } from '../organization-members/organization-members.module.js';

@Module({
  imports: [
    AuthModule,

    OrganizationMembersModule,

    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
      {
        name: Ticket.name,
        schema: TicketSchema,
      },
      {
        name: Task.name,
        schema: TaskSchema,
      },
    ]),
  ],

  controllers: [
    CommentsController,
  ],

  providers: [
    CommentsService,
  ],
})
export class CommentsModule {}

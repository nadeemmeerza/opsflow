import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Comment,
  CommentDocument,
} from './schemas/comment.schema.js';

import {
  Ticket,
  TicketDocument,
} from '../tickets/schemas/ticket.schema.js';

import {
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel:
      Model<CommentDocument>,

    @InjectModel(Ticket.name)
    private readonly ticketModel:
      Model<TicketDocument>,

    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,
  ) {}

  async create(
    organizationId: string,
    authorId: string,
    data: {
      content: string;
      ticketId?: string;
      taskId?: string;
    },
  ) {
    if (
      (!data.ticketId && !data.taskId) ||
      (data.ticketId && data.taskId)
    ) {
      throw new BadRequestException(
        'A comment must belong to either a ticket or a task',
      );
    }

    const organizationObjectId =
      new Types.ObjectId(organizationId);

    if (data.ticketId) {
      const ticket =
        await this.ticketModel.findOne({
          _id: new Types.ObjectId(
            data.ticketId,
          ),
          organizationId:
            organizationObjectId,
        });

      if (!ticket) {
        throw new NotFoundException(
          'Ticket not found',
        );
      }
    }

    if (data.taskId) {
      const task =
        await this.taskModel.findOne({
          _id: new Types.ObjectId(
            data.taskId,
          ),
          organizationId:
            organizationObjectId,
        });

      if (!task) {
        throw new NotFoundException(
          'Task not found',
        );
      }
    }

    return this.commentModel.create({
      organizationId:
        organizationObjectId,

      authorId:
        new Types.ObjectId(authorId),

      ticketId: data.ticketId
        ? new Types.ObjectId(
            data.ticketId,
          )
        : null,

      taskId: data.taskId
        ? new Types.ObjectId(
            data.taskId,
          )
        : null,

      content: data.content.trim(),
    });
  }

  async findByTicket(
    organizationId: string,
    ticketId: string,
  ) {
    const ticket =
      await this.ticketModel.findOne({
        _id: new Types.ObjectId(ticketId),
        organizationId:
          new Types.ObjectId(organizationId),
      });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found',
      );
    }

    return this.commentModel
      .find({
        organizationId:
          new Types.ObjectId(organizationId),
        ticketId:
          new Types.ObjectId(ticketId),
      })
      .populate(
        'authorId',
        'name email status',
      )
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async findByTask(
    organizationId: string,
    taskId: string,
  ) {
    const task =
      await this.taskModel.findOne({
        _id: new Types.ObjectId(taskId),
        organizationId:
          new Types.ObjectId(organizationId),
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return this.commentModel
      .find({
        organizationId:
          new Types.ObjectId(organizationId),
        taskId:
          new Types.ObjectId(taskId),
      })
      .populate(
        'authorId',
        'name email status',
      )
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async findOne(
    organizationId: string,
    commentId: string,
  ) {
    const comment =
      await this.commentModel
        .findOne({
          _id: new Types.ObjectId(
            commentId,
          ),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        })
        .populate(
          'authorId',
          'name email status',
        )
        .exec();

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    return comment;
  }

  async update(
    organizationId: string,
    commentId: string,
    userId: string,
    content: string,
  ) {
    const comment =
      await this.commentModel.findOne({
        _id: new Types.ObjectId(commentId),
        organizationId:
          new Types.ObjectId(organizationId),
      });

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    if (
      comment.authorId.toString() !==
      userId
    ) {
      throw new ForbiddenException(
        'You can only edit your own comments',
      );
    }

    comment.content = content.trim();

    return comment.save();
  }

  async remove(
    organizationId: string,
    commentId: string,
    userId: string,
    organizationRole: string,
  ) {
    const comment =
      await this.commentModel.findOne({
        _id: new Types.ObjectId(commentId),
        organizationId:
          new Types.ObjectId(organizationId),
      });

    if (!comment) {
      throw new NotFoundException(
        'Comment not found',
      );
    }

    const isAuthor =
      comment.authorId.toString() ===
      userId;

    const isAdmin =
      organizationRole === 'owner' ||
      organizationRole === 'admin';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'You can only delete your own comments unless you are an organization admin',
      );
    }

    await comment.deleteOne();

    return {
      success: true,
      message:
        'Comment deleted successfully',
    };
  }
}

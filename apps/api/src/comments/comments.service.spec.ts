import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { CommentsService } from './comments.service.js';
import { Comment } from './schemas/comment.schema.js';
import { Ticket } from '../tickets/schemas/ticket.schema.js';
import { Task } from '../tasks/schemas/task.schema.js';

describe('CommentsService', () => {
  let service: CommentsService;

  let commentModel: any;
  let ticketModel: any;
  let taskModel: any;

  const organizationId = new Types.ObjectId().toString();
  const authorId = new Types.ObjectId().toString();
  const otherUserId = new Types.ObjectId().toString();
  const ticketId = new Types.ObjectId().toString();
  const taskId = new Types.ObjectId().toString();
  const commentId = new Types.ObjectId().toString();

  /**
   * Creates the Mongoose query chain used by findByTicket,
   * findByTask and findOne.
   */
  const setupCommentQuery = (result: unknown) => {
    const query = {
      populate: vi.fn(),
      sort: vi.fn(),
      exec: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.exec.mockResolvedValue(result);

    return query;
  };

  beforeEach(async () => {
    commentModel = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    ticketModel = {
      findOne: vi.fn(),
    };

    taskModel = {
      findOne: vi.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          CommentsService,
          {
            provide: getModelToken(Comment.name),
            useValue: commentModel,
          },
          {
            provide: getModelToken(Ticket.name),
            useValue: ticketModel,
          },
          {
            provide: getModelToken(Task.name),
            useValue: taskModel,
          },
        ],
      }).compile();

    service =
      module.get<CommentsService>(
        CommentsService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment for a ticket', async () => {
      const comment = {
        _id: new Types.ObjectId(commentId),
        content: 'Ticket comment',
      };

      ticketModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(ticketId),
      });

      commentModel.create.mockResolvedValue(
        comment,
      );

      const result =
        await service.create(
          organizationId,
          authorId,
          {
            content:
              '  Ticket comment  ',
            ticketId,
          },
        );

      expect(result).toBe(comment);

      expect(ticketModel.findOne)
        .toHaveBeenCalledWith({
          _id: new Types.ObjectId(
            ticketId,
          ),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(commentModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          authorId:
            new Types.ObjectId(authorId),
          ticketId:
            new Types.ObjectId(ticketId),
          taskId: null,
          content: 'Ticket comment',
        });

      expect(taskModel.findOne)
        .not.toHaveBeenCalled();
    });

    it('should create a comment for a task', async () => {
      const comment = {
        _id: new Types.ObjectId(commentId),
        content: 'Task comment',
      };

      taskModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(taskId),
      });

      commentModel.create.mockResolvedValue(
        comment,
      );

      const result =
        await service.create(
          organizationId,
          authorId,
          {
            content: '  Task comment  ',
            taskId,
          },
        );

      expect(result).toBe(comment);

      expect(taskModel.findOne)
        .toHaveBeenCalledWith({
          _id: new Types.ObjectId(taskId),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(commentModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          authorId:
            new Types.ObjectId(authorId),
          ticketId: null,
          taskId:
            new Types.ObjectId(taskId),
          content: 'Task comment',
        });

      expect(ticketModel.findOne)
        .not.toHaveBeenCalled();
    });

    it('should reject a comment without a ticket or task', async () => {
      await expect(
        service.create(
          organizationId,
          authorId,
          {
            content: 'Invalid comment',
          },
        ),
      ).rejects.toThrow(
        'A comment must belong to either a ticket or a task',
      );

      expect(
        commentModel.create,
      ).not.toHaveBeenCalled();
    });

    it('should reject a comment belonging to both a ticket and a task', async () => {
      await expect(
        service.create(
          organizationId,
          authorId,
          {
            content: 'Invalid comment',
            ticketId,
            taskId,
          },
        ),
      ).rejects.toThrow(
        'A comment must belong to either a ticket or a task',
      );

      expect(
        ticketModel.findOne,
      ).not.toHaveBeenCalled();

      expect(
        taskModel.findOne,
      ).not.toHaveBeenCalled();

      expect(
        commentModel.create,
      ).not.toHaveBeenCalled();
    });

    it('should reject a comment when the ticket does not exist in the organization', async () => {
      ticketModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.create(
          organizationId,
          authorId,
          {
            content: 'Ticket comment',
            ticketId,
          },
        ),
      ).rejects.toThrow(
        'Ticket not found',
      );

      expect(
        commentModel.create,
      ).not.toHaveBeenCalled();
    });

    it('should reject a comment when the task does not exist in the organization', async () => {
      taskModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.create(
          organizationId,
          authorId,
          {
            content: 'Task comment',
            taskId,
          },
        ),
      ).rejects.toThrow(
        'Task not found',
      );

      expect(
        commentModel.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findByTicket', () => {
    it('should return comments for a ticket', async () => {
      const comments = [
        {
          _id: new Types.ObjectId(),
          content: 'First comment',
        },
        {
          _id: new Types.ObjectId(),
          content: 'Second comment',
        },
      ];

      ticketModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(ticketId),
      });

      const query =
        setupCommentQuery(comments);

      commentModel.find.mockReturnValue(
        query,
      );

      const result =
        await service.findByTicket(
          organizationId,
          ticketId,
        );

      expect(result).toBe(comments);

      expect(ticketModel.findOne)
        .toHaveBeenCalledWith({
          _id: new Types.ObjectId(ticketId),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(commentModel.find)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          ticketId:
            new Types.ObjectId(ticketId),
        });

      expect(query.populate)
        .toHaveBeenCalledWith(
          'authorId',
          'name email status',
        );

      expect(query.sort)
        .toHaveBeenCalledWith({
          createdAt: 1,
        });
    });

    it('should throw when the ticket does not exist', async () => {
      ticketModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.findByTicket(
          organizationId,
          ticketId,
        ),
      ).rejects.toThrow(
        'Ticket not found',
      );

      expect(
        commentModel.find,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findByTask', () => {
    it('should return comments for a task', async () => {
      const comments = [
        {
          _id: new Types.ObjectId(),
          content: 'Task comment',
        },
      ];

      taskModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(taskId),
      });

      const query =
        setupCommentQuery(comments);

      commentModel.find.mockReturnValue(
        query,
      );

      const result =
        await service.findByTask(
          organizationId,
          taskId,
        );

      expect(result).toBe(comments);

      expect(taskModel.findOne)
        .toHaveBeenCalledWith({
          _id: new Types.ObjectId(taskId),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(commentModel.find)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          taskId:
            new Types.ObjectId(taskId),
        });

      expect(query.populate)
        .toHaveBeenCalledWith(
          'authorId',
          'name email status',
        );

      expect(query.sort)
        .toHaveBeenCalledWith({
          createdAt: 1,
        });
    });

    it('should throw when the task does not exist', async () => {
      taskModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.findByTask(
          organizationId,
          taskId,
        ),
      ).rejects.toThrow(
        'Task not found',
      );

      expect(
        commentModel.find,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a comment scoped to the organization', async () => {
      const comment = {
        _id: new Types.ObjectId(commentId),
        content: 'My comment',
      };

      const query =
        setupCommentQuery(comment);

      commentModel.findOne.mockReturnValue(
        query,
      );

      const result =
        await service.findOne(
          organizationId,
          commentId,
        );

      expect(result).toBe(comment);

      expect(commentModel.findOne)
        .toHaveBeenCalledWith({
          _id: new Types.ObjectId(
            commentId,
          ),
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(query.populate)
        .toHaveBeenCalledWith(
          'authorId',
          'name email status',
        );
    });

    it('should throw when the comment does not exist', async () => {
      const query =
        setupCommentQuery(null);

      commentModel.findOne.mockReturnValue(
        query,
      );

      await expect(
        service.findOne(
          organizationId,
          commentId,
        ),
      ).rejects.toThrow(
        'Comment not found',
      );
    });
  });

  describe('update', () => {
    it('should update the author own comment', async () => {
      const save = vi
        .fn()
        .mockResolvedValue({
          _id: new Types.ObjectId(
            commentId,
          ),
          content: 'Updated comment',
        });

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'Old comment',
        save,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      const result =
        await service.update(
          organizationId,
          commentId,
          authorId,
          '  Updated comment  ',
        );

      expect(comment.content).toBe(
        'Updated comment',
      );

      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        _id: comment._id,
        content: 'Updated comment',
      });
    });

    it('should throw when the comment does not exist', async () => {
      commentModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          organizationId,
          commentId,
          authorId,
          'Updated comment',
        ),
      ).rejects.toThrow(
        'Comment not found',
      );
    });

    it('should prevent another user from editing the comment', async () => {
      const save = vi.fn();

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'Original comment',
        save,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      await expect(
        service.update(
          organizationId,
          commentId,
          otherUserId,
          'Unauthorized edit',
        ),
      ).rejects.toThrow(
        'You can only edit your own comments',
      );

      expect(comment.content).toBe(
        'Original comment',
      );

      expect(save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should allow the author to delete their own comment', async () => {
      const deleteOne = vi
        .fn()
        .mockResolvedValue(undefined);

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'My comment',
        deleteOne,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      const result =
        await service.remove(
          organizationId,
          commentId,
          authorId,
          'member',
        );

      expect(deleteOne).toHaveBeenCalledTimes(
        1,
      );

      expect(result).toEqual({
        success: true,
        message:
          'Comment deleted successfully',
      });
    });

    it('should allow an owner to delete another user comment', async () => {
      const deleteOne = vi
        .fn()
        .mockResolvedValue(undefined);

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'Another user comment',
        deleteOne,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      await expect(
        service.remove(
          organizationId,
          commentId,
          otherUserId,
          'owner',
        ),
      ).resolves.toEqual({
        success: true,
        message:
          'Comment deleted successfully',
      });

      expect(deleteOne).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should allow an admin to delete another user comment', async () => {
      const deleteOne = vi
        .fn()
        .mockResolvedValue(undefined);

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'Another user comment',
        deleteOne,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      await expect(
        service.remove(
          organizationId,
          commentId,
          otherUserId,
          'admin',
        ),
      ).resolves.toEqual({
        success: true,
        message:
          'Comment deleted successfully',
      });

      expect(deleteOne).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should prevent a member from deleting another user comment', async () => {
      const deleteOne = vi.fn();

      const comment = {
        _id: new Types.ObjectId(commentId),
        authorId:
          new Types.ObjectId(authorId),
        content: 'Protected comment',
        deleteOne,
      };

      commentModel.findOne.mockResolvedValue(
        comment,
      );

      await expect(
        service.remove(
          organizationId,
          commentId,
          otherUserId,
          'member',
        ),
      ).rejects.toThrow(
        'You can only delete your own comments unless you are an organization admin',
      );

      expect(
        deleteOne,
      ).not.toHaveBeenCalled();
    });

    it('should throw when the comment does not exist', async () => {
      commentModel.findOne.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(
          organizationId,
          commentId,
          authorId,
          'member',
        ),
      ).rejects.toThrow(
        'Comment not found',
      );
    });
  });
});
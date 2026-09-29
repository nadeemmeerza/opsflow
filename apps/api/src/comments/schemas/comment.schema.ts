import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({
  timestamps: true,
})
export class Comment {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  authorId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Ticket',
    default: null,
    index: true,
  })
  ticketId: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true,
  })
  taskId: Types.ObjectId | null;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000,
  })
  content: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CommentSchema =
  SchemaFactory.createForClass(Comment);

CommentSchema.index({
  organizationId: 1,
  ticketId: 1,
  createdAt: 1,
});

CommentSchema.index({
  organizationId: 1,
  taskId: 1,
  createdAt: 1,
});
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
})
export class Task {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 5000,
    default: '',
  })
  description: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  projectId: Types.ObjectId;

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
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assigneeId: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
  })
  status: 'todo' | 'in_progress' | 'review' | 'done';

  @Prop({
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Prop({
    type: Date,
    default: null,
  })
  dueDate: Date | null;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({
  organizationId: 1,
  projectId: 1,
  createdAt: -1,
});

TaskSchema.index({
  organizationId: 1,
  status: 1,
});

TaskSchema.index({
  organizationId: 1,
  assigneeId: 1,
});

TaskSchema.index({
  organizationId: 1,
  createdAt: -1,
});

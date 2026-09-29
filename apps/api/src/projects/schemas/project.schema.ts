import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({
  timestamps: true,
})
export class Project {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 20,
  })
  key: string;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  description: string;

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
    required: true,
    enum: ['active', 'archived'],
    default: 'active',
  })
  status: 'active' | 'archived';

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ProjectSchema =
  SchemaFactory.createForClass(Project);

// A project key must be unique inside an organization.
ProjectSchema.index(
  {
    organizationId: 1,
    key: 1,
  },
  {
    unique: true,
  },
);

ProjectSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

ProjectSchema.index({
  organizationId: 1,
  createdAt: -1,
});
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({
  timestamps: true,
})
export class Organization {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    required: true,
    enum: ['active', 'suspended'],
    default: 'active',
  })
  status: 'active' | 'suspended';

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  ownerId: Types.ObjectId;
}

export const OrganizationSchema =
  SchemaFactory.createForClass(Organization);
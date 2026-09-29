import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationMemberDocument =
  HydratedDocument<OrganizationMember> & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({
  timestamps: true,
})
export class OrganizationMember {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  })
  role: 'owner' | 'admin' | 'member';
}

export const OrganizationMemberSchema =
  SchemaFactory.createForClass(OrganizationMember);

OrganizationMemberSchema.index(
  {
    organizationId: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

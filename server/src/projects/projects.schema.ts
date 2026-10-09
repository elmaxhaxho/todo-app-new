import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  description!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  workspaceId!: Types.ObjectId;

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'User',
    },
  ])
  members!: Types.ObjectId[];

  @Prop([
    {
      type: Types.ObjectId,
      ref: 'Task',
    },
  ])
  tasks!: Types.ObjectId[];

  @Prop({
    type: Boolean,
    default: false,
  })
  archived!: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  deleted!: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    return ret;
  },
});
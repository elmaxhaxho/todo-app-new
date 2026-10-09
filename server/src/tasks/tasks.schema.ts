import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  projectId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  workspaceId!: Types.ObjectId;

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
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  })
  status!: string;

  @Prop({
    type: String,
    default: 'General',
    trim: true,
  })
  label!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assignedTo!: Types.ObjectId | null;

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

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    return ret;
  },
});
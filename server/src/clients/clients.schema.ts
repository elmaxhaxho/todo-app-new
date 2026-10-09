import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

@Schema()
export class Client {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  company!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  email!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  phone!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  address!: string;

  @Prop({
    type: String,
    default: '',
    trim: true,
  })
  notes!: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  workspaceId!: Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt!: Date;

  @Prop({
    type: Boolean,
    default: false,
  })
  deleted!: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
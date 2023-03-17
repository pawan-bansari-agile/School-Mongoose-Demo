import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import Role from 'src/utils/consts';

export type SchoolDocument = HydratedDocument<School>;

@Schema()
export class School {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: null })
  photo: string;

  @Prop({ required: true })
  zipCode: number;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ default: Role.School })
  role: Role;

  @Prop({ default: null })
  forgetPwdToken: string;

  @Prop({ default: null })
  forgetPwdExpires: string;

  @Prop({ default: false })
  deleted: boolean;
}

const SchoolSchema = SchemaFactory.createForClass(School);
SchoolSchema.index({ name: 'text' });
export { SchoolSchema };

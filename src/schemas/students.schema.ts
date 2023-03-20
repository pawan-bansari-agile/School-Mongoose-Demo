import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { School } from './schools.schema';

export type StudentDocument = HydratedDocument<Student>;

@Schema()
export class Student {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  parentNumber: number;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  std: number;

  @Prop({ default: null })
  photo: string;

  @Prop({ required: true })
  dob: Date;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'School' })
  school: School;
}

const StudentSchema = SchemaFactory.createForClass(Student);
StudentSchema.index({ name: 'text' });
export { StudentSchema };

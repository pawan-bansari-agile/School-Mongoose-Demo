import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument } from 'mongoose';
import { School } from './schools.schema';

export type StudentDocument = HydratedDocument<Student>;

@Schema()
export class Student {
  @ApiProperty({
    description: 'Name of the student!',
    example: 'test',
    type: String,
  })
  @Prop({ required: true, index: true })
  name: string;

  @ApiProperty({
    description: 'Parent Number of the student!',
    example: '7798813105',
    type: Number,
  })
  @Prop({ required: true })
  parentNumber: number;

  @ApiProperty({
    description: 'Parent Number of the student!',
    example: '7798813105',
    type: Number,
  })
  @Prop({ required: true })
  address: string;

  @ApiProperty({
    description: 'Standard of the student!',
    example: '1',
    type: Number,
  })
  @Prop({ required: true })
  std: number;

  @ApiProperty({
    description: 'photo of the student!',
    example: 'testImage.jpg',
    type: Number,
  })
  @Prop({ default: null })
  photo: string;

  @ApiProperty({
    description: 'Birth date of the student!',
    example: '13-01-1996',
    type: Date,
  })
  @Prop({ required: true })
  dob: Date;

  @ApiProperty({
    description: 'Status of the student!',
    example: 'true',
    type: Boolean,
  })
  @Prop({ default: true })
  status: boolean;

  @Prop({ default: false })
  deleted: boolean;

  @ApiProperty({
    description: 'School of the student!',
    example: 'abcdefghijklmnopqrstuvwxyz',
    type: String,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'School' })
  school: School;
}

const StudentSchema = SchemaFactory.createForClass(Student);
StudentSchema.index({ name: 'text' });
export { StudentSchema };

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import Role from 'src/utils/consts';

export type SchoolDocument = HydratedDocument<School>;

@Schema()
export class School {
  @ApiProperty({
    description: 'Name of the school!',
    example: 'test',
    type: String,
  })
  @Prop({ required: true, index: true })
  name: string;

  @ApiProperty({
    description: 'Email of the school!',
    example: 'test',
    type: String,
  })
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @ApiProperty({
    description: 'Address of the school!',
    example: 'address',
    type: String,
  })
  @Prop({ required: true })
  address: string;

  @ApiProperty({
    description: 'Image of the school!',
    example: 'testImage.jpg',
    type: String,
  })
  @Prop({ default: null })
  photo: string;

  @ApiProperty({
    description: 'Zip Code of the school!',
    example: '411017',
    type: Number,
  })
  @Prop({ required: true })
  zipCode: number;

  @ApiProperty({
    description: 'City of the school!',
    example: 'Ahmedabad',
    type: String,
  })
  @Prop({ required: true })
  city: string;

  @ApiProperty({
    description: 'State of the school!',
    example: 'Gujarat',
    type: String,
  })
  @Prop({ required: true })
  state: string;

  @ApiProperty({
    description: 'Country of the school!',
    example: 'India',
    type: String,
  })
  @Prop({ required: true })
  country: string;

  @ApiProperty({
    description: 'Role of the school!',
    example: 'School',
    type: String,
  })
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

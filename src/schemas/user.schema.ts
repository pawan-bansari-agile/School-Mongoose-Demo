import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import Role from 'src/utils/consts';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @ApiProperty({
    description: 'User Name of the user!',
    example: 'Test',
    type: String,
  })
  @Prop({ required: true })
  userName: string;

  @ApiProperty({
    description: 'Email Name of the user!',
    example: 'Test@yopmail.com',
    type: String,
  })
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @ApiProperty({
    description: 'Role of the user!',
    example: 'Admin',
    type: String,
  })
  @Prop({ default: Role.Reader })
  role: Role;

  @Prop({ default: null })
  forgetPwdToken: string;

  @Prop({ default: null })
  forgetPwdExpires: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

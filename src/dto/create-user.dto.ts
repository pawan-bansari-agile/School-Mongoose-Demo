import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import Role, { emailRegex } from 'src/utils/consts';

export class CreateUserDto {
  @ApiProperty({
    description: 'The name of the user!',
    example: 'Test',
  })
  @IsNotEmpty()
  @IsString()
  userName: string;

  @ApiProperty({
    description: 'The email of the user!',
    example: 'test@yopmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;

  @ApiProperty({
    description: 'The role assigned to the user!',
    example: 'Admin/Reader/School',
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class LoginUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'The email of the user!',
    example: 'test@yopmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;

  @ApiProperty({
    description: 'The password of the user!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgetPassDto {
  @ApiProperty({
    description: 'The email of the user!',
    example: 'test@yopmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;
}

export class ResetPassDto {
  @ApiProperty({
    description: 'The new password of the user!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  newPass: string;

  @ApiProperty({
    description: 'Confirm the new password of the user! It should be matching!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  confirmPass: string;
}

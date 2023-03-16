import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import Role, { emailRegex } from 'src/utils/consts';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;

  @IsOptional()
  role: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class LoginUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgetPassDto {
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;
}

export class ResetPassDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  newPass: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  confirmPass: string;
}

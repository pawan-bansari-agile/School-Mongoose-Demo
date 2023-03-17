import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { emailRegex } from 'src/utils/consts';

export class CreateSchoolDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  photo: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {}

export class LoginSchoolDto extends PartialType(CreateSchoolDto) {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgetSchoolPassDto {
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;
}

export class ResetSchoolPassDto {
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

import { PartialType } from '@nestjs/mapped-types';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { phoneRegex } from 'src/utils/consts';
// import * as DoubleType from '@mongoosejs/double';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(phoneRegex, { message: 'does not match!' })
  parentNumber: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  std: number;

  @IsString()
  @IsOptional()
  photo: string;

  @IsString()
  @IsNotEmpty()
  dob: Date;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

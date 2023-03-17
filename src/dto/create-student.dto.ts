import { PartialType } from '@nestjs/mapped-types';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  parentNumber: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  std: number;

  @IsString()
  @IsOptional()
  photo: string;

  @IsDate()
  @IsNotEmpty()
  dob: Date;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

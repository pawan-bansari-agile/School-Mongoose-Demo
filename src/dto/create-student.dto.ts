// import { PartialType } from '@nestjs/swagger';
import { ApiExtraModels, ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { phoneRegex } from 'src/utils/consts';

export class CreateStudentDto {
  @ApiProperty({
    description: 'The name of the student!',
    example: 'Test',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The phone number of the students parent!',
    example: '7798813105',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(phoneRegex, { message: 'does not match!' })
  parentNumber: number;

  @ApiProperty({
    description: 'The address of the student!',
    example: 'nehrunagar',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'The standard in which the student is!',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  std: number;

  @ApiProperty({
    description: 'The image of the student!',
    example: 'testImage.jpeg',
  })
  @IsString()
  @IsOptional()
  photo: string;

  @ApiProperty({
    description: 'The date of birth of the student!',
    example: '13-01-1996',
  })
  @IsString()
  @IsNotEmpty()
  dob: Date;
}

@ApiExtraModels()
export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'The status of the student!',
    example: 'true/false',
  })
  @IsBoolean()
  status: boolean;
}

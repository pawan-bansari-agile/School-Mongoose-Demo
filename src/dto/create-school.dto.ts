import {
  OmitType,
  PartialType,
  ApiExtraModels,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { emailRegex } from 'src/utils/consts';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'The name of the School!',
    example: 'Test',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The email of the School!',
    example: 'test@yopmail.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;

  @ApiProperty({
    description: 'The address of the School!',
    example: 'Test Address!',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'The image of the School!',
    example: 'testImage.jpg',
    type: String,
  })
  @IsOptional()
  @IsString()
  photo: string;

  @ApiProperty({
    description: 'The Zip Code of the School!',
    example: '411017',
    type: Number,
  })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    description: 'The City where the School is!',
    example: 'Ahmedabad',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'The State where the School is!',
    example: 'Gujarat',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'The Country where the School is!',
    example: 'India',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  country: string;
}

@ApiExtraModels()
export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {
  constructor(partial: Partial<CreateSchoolDto>) {
    super(partial);
  }
}

export class LoginSchoolDto extends OmitType(CreateSchoolDto, [
  'name',
  'address',
  'photo',
  'zipCode',
  'city',
  'state',
  'country',
]) {
  @ApiProperty({
    description: 'Password is required only while logging in!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgetSchoolPassDto {
  @ApiProperty({
    description: 'The email of the registered school!!',
    example: 'test@yopmail.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(emailRegex, { message: 'Invalid Email!' })
  email: string;
}

export class ResetSchoolPassDto {
  @ApiProperty({
    description: 'The new password of the School!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  newPass: string;

  @ApiProperty({
    description:
      'Confirm the new password of the School! It should be matching!',
    example: 'test@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  confirmPass: string;
}

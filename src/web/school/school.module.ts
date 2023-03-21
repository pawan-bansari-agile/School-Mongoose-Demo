import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtHelper } from 'src/utils/utils';
import { School, SchoolSchema } from 'src/schemas/schools.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
  ],
  controllers: [SchoolController],
  providers: [SchoolService, JwtService, JwtHelper],
})
export class SchoolModule {}

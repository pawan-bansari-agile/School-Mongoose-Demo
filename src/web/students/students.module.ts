import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from 'src/schemas/students.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { SchoolService } from '../school/school.service';
import { School, SchoolSchema } from 'src/schemas/schools.schema';
import { JwtHelper } from 'src/utils/utils';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: School.name, schema: SchoolSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService, JwtService, SchoolService, JwtHelper],
})
export class StudentsModule {}

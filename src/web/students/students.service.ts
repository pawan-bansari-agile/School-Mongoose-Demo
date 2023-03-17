import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchoolDocument } from 'src/schemas/schools.schema';
import { Student, StudentDocument } from 'src/schemas/students.schema';
import { SUCCESS_MSGS } from 'src/utils/consts';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studModel: Model<StudentDocument>,
  ) {}
  async create(
    createStudentDto: CreateStudentDto,
    user: SchoolDocument,
    file: Express.Multer.File,
  ) {
    try {
      if (file) {
        createStudentDto.photo = file.filename;
      }
      const newStudent = new this.studModel(createStudentDto);
      newStudent.school = user.id;
      await newStudent.save();
      return { message: SUCCESS_MSGS.STUDENT_CREATED };
    } catch (err) {
      return err;
    }
  }

  findAll() {
    return `This action returns all students`;
  }

  findOne(id: number) {
    return `This action returns a #${id} student`;
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return `This action updates a #${id} student`;
  }

  remove(id: number) {
    return `This action removes a #${id} student`;
  }
}

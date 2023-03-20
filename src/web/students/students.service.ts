import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { SchoolDocument } from 'src/schemas/schools.schema';
import { Student, StudentDocument } from 'src/schemas/students.schema';
import Role, { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';
import * as fs from 'fs';

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

  async findAll(user, query) {
    try {
      const fieldName = query.fieldName || '';
      const fieldValue = query.fieldValue || '';
      const pageNumber = query.pageNumber || 1;
      const limit = query.limit || 10;
      const keyword = query.keyword || '';
      const sortBy = query.sortBy || '';
      const sortOrder = query.sortOrder || '';
      const pipeline = [];
      if (user.role == Role.Admin) {
        if (keyword) {
          pipeline.push(
            { $match: { $text: { $search: keyword } } },
            { $match: { deleted: false } },
          );
        } else {
          pipeline.push({ $match: { deleted: false } });
        }
      } else if (user.role == Role.School) {
        if (keyword) {
          pipeline.push(
            { $match: { $text: { $search: keyword } } },
            { $match: { deleted: false } },
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
          );
        } else {
          pipeline.push(
            { $match: { deleted: false } },
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
          );
        }
      }
      if (fieldName && fieldValue) {
        pipeline.push({ $match: { [fieldName]: fieldValue } });
      }
      if (sortBy && sortOrder) {
        pipeline.push({ $sort: { [sortBy]: +sortOrder } });
      } else if (sortBy) {
        pipeline.push({ $sort: { [sortBy]: 1 } });
      }
      pipeline.push(
        { $skip: (pageNumber - 1) * limit },
        { $limit: +limit },
        { $project: { password: 0 } },
      );
      const students = await this.studModel.aggregate(pipeline);
      return { message: SUCCESS_MSGS.FIND_ALL_STUDENTS, students };
    } catch (err) {
      return err;
    }
  }

  async findOne(user, query) {
    try {
      const name = query.name || '';
      const id = query.id || '';
      const pipeline = [];
      if (user.role == Role.Admin) {
        if (name) {
          pipeline.push(
            {
              $match: { $text: { $search: name } },
            },
            { $match: { deleted: false } },
          );
        } else {
          pipeline.push(
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { $match: { deleted: false } },
          );
        }
      } else if (user.role == Role.School) {
        if (name) {
          pipeline.push(
            {
              $match: { $text: { $search: name } },
            },
            { $match: { deleted: false } },
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
          );
        } else {
          pipeline.push(
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { $match: { deleted: false } },
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
          );
        }
      }
      const existingStud = await this.studModel.aggregate(pipeline);
      if (!existingStud) {
        throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
      }
      return { message: SUCCESS_MSGS.FOUND_ONE_STUDENT, existingStud };
    } catch (err) {
      return err;
    }
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    user,
    file: Express.Multer.File,
  ) {
    try {
      const existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
      if (!existingStud) {
        throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
      }
      if (file) {
        updateStudentDto.photo = file.filename;
      }
      const updatedDetails = await this.studModel.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            name: updateStudentDto?.name,
            parentNumber: updateStudentDto?.parentNumber,
            address: updateStudentDto?.address,
            std: updateStudentDto?.std,
            photo: updateStudentDto?.photo,
            dob: updateStudentDto?.dob,
          },
        },
        { projection: { password: 0 }, new: true },
      );
      existingStud.photo
        ? fs.unlink(`${file.destination}/${existingStud.photo}`, (err) => {
            if (err) {
              console.log('File error', err);
            }
          })
        : null;
      return updatedDetails;
    } catch (err) {
      return err;
    }
  }

  async isActive(id: string, user: SchoolDocument, body) {
    try {
      const status: boolean = body.status || false;
      const existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
      if (!existingStud) {
        throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
      }
      if (existingStud.status == status) {
        throw new BadRequestException(ERR_MSGS.NO_CHANGE_DETECTED);
      }
      const updatedDetails = await this.studModel.findOneAndUpdate(
        { _id: id },
        { $set: { status: status } },
        { new: true },
      );
      return { message: SUCCESS_MSGS.STATUS_CHANGED, updatedDetails };
    } catch (err) {
      return err;
    }
  }

  async remove(user: SchoolDocument, id: string) {
    try {
      const existingStud = await this.studModel.findOne({
        $and: [
          { _id: new mongoose.Types.ObjectId(id) },
          { school: user.id },
          { deleted: false },
        ],
      });
      if (!existingStud) {
        throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
      }
      await this.studModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { deleted: true } },
      );
      return { message: SUCCESS_MSGS.STUDENT_DELETED };
    } catch (err) {
      return err;
    }
  }

  async totalCount(user, query) {
    try {
      const std = query.std || '';
      const school = query.school || '';
      const pipeline = [];
      pipeline.push({ $match: { deleted: false } });
      if (user.role == Role.Admin) {
        if (std) {
          pipeline.push({ $match: { std: std } });
        } else if (school) {
          pipeline.push({ $match: { school: school } });
        }
      } else if (user.role == Role.School) {
        if (std) {
          pipeline.push(
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
            { $match: { std: std } },
          );
        } else {
          pipeline.push({
            $match: { school: new mongoose.Types.ObjectId(user.id) },
          });
        }
      }
      pipeline.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      });
      const totalCount = await this.studModel.aggregate(pipeline);

      return totalCount[0].count;
    } catch (err) {
      return err;
    }
  }
}

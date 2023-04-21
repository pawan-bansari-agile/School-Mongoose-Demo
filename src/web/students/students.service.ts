import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { SchoolDocument } from 'src/schemas/schools.schema';
import { Student, StudentDocument } from 'src/schemas/students.schema';
import Role, { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
import {
  CreateStudentDto,
  UpdateStatusDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';
import * as fs from 'fs';
import { globalResponse, responseMap } from 'src/generics/genericResponse';
import { SchoolService } from '../school/school.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studModel: Model<StudentDocument>,
    private schoolService: SchoolService,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
    user: SchoolDocument,
    file: Express.Multer.File,
  ): globalResponse {
    try {
      if (file) {
        createStudentDto.photo = file.filename;
      }
      const newStudent = new this.studModel(createStudentDto);
      newStudent.school = user.id;
      await newStudent.save();
      return responseMap({ newStudent }, SUCCESS_MSGS.STUDENT_CREATED);
    } catch (err) {
      return err;
    }
  }

  async findAll(user, query): globalResponse {
    try {
      const fieldName = query.fieldName || '';
      const fieldValue = query.fieldValue || '';
      const pageNumber = query.pageNumber || 1;
      const limit = query.limit || 10;
      const keyword = query.keyword || '';
      const regex = new RegExp(keyword, 'i');
      const sortBy = query.sortBy || '';
      const sortOrder = query.sortOrder || '';
      const pipeline = [];
      if (user.role == Role.Admin) {
        if (keyword) {
          pipeline.push(
            { $match: { name: { $regex: regex } } },
            { $match: { deleted: false } },
          );
        } else {
          pipeline.push({ $match: { deleted: false } });
        }
      } else if (user.role == Role.School) {
        if (keyword) {
          pipeline.push(
            { $match: { name: { $regex: keyword } } },
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
      // if (fieldName && fieldValue) {
      //   if (fieldName == 'school') {
      //     const newFieldValue = new mongoose.Types.ObjectId(fieldValue);

      //     pipeline.push({ $match: { [fieldName]: newFieldValue } });
      //   } else if (fieldName == 'std') {
      //     pipeline.push({ $match: { [fieldName]: +fieldValue } });
      //   }
      // }
      // if (fieldName && fieldValue) {
      //   pipeline.push({ $match: { [fieldName]: fieldValue } });
      // }
      if (fieldName && fieldValue) {
        if (fieldName === 'school') {
          try {
            const schoolId = new mongoose.Types.ObjectId(fieldValue);
            pipeline.push({ $match: { [fieldName]: schoolId } });
          } catch (err) {
            console.error('Invalid ObjectId for school field');
          }
        } else if (fieldName === 'std') {
          pipeline.push({ $match: { [fieldName]: +fieldValue } });
        }
      }

      if (sortBy || sortOrder) {
        if (sortBy && sortOrder) {
          pipeline.push({ $sort: { [sortBy]: +sortOrder } });
        } else if (sortBy) {
          pipeline.push({ $sort: { [sortBy]: 1 } });
        } else if (sortOrder) {
          pipeline.push({ $sort: { std: +sortOrder } });
        }
      }
      pipeline.push(
        { $skip: (pageNumber - 1) * limit },
        { $limit: +limit },
        { $project: { password: 0 } },
      );
      console.log('pipeline', pipeline);

      const students = await this.studModel.aggregate(pipeline);
      console.log('studentss', students);
      if (!students) {
        console.log('inside truthyness check');
      }

      return responseMap(students, SUCCESS_MSGS.FIND_ALL_STUDENTS);
    } catch (err) {
      return err;
    }
  }

  async findOne(user, query): globalResponse {
    try {
      const name = query.name || '';
      const regex = new RegExp(name, 'i');
      const id = query.id || '';
      const pipeline = [];
      if (user.role == Role.Admin) {
        if (name) {
          pipeline.push(
            {
              $match: { name: { $regex: regex } },
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
              $match: { name: { $regex: regex } },
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
        const error = new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      return responseMap({ existingStud }, SUCCESS_MSGS.FOUND_ONE_STUDENT);
    } catch (err) {
      console.log('from catch block', err);

      const error = err;
      return responseMap({}, '', { error });
    }
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    user: SchoolDocument,
    file: Express.Multer.File,
  ) {
    try {
      const existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
      if (!existingStud) {
        const error = new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
        return responseMap({}, '', { error });
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
            }
          })
        : null;
      return updatedDetails;
    } catch (err) {
      return err;
    }
  }

  async isActive(
    id: string,
    user: SchoolDocument,
    body: UpdateStatusDto,
  ): globalResponse {
    try {
      const status: boolean = body.status || false;
      const existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
      if (!existingStud) {
        const error = new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      if (existingStud.status == status) {
        const error = new BadRequestException(ERR_MSGS.NO_CHANGE_DETECTED);
        return responseMap({}, '', { error });
      }
      const updatedDetails = await this.studModel.findOneAndUpdate(
        { _id: id },
        { $set: { status: status } },
        { new: true },
      );
      return responseMap({ updatedDetails }, SUCCESS_MSGS.STATUS_CHANGED);
    } catch (err) {
      return err;
    }
  }

  async remove(user: SchoolDocument, id: string): globalResponse {
    try {
      const existingStud = await this.studModel.findOne({
        $and: [
          { _id: new mongoose.Types.ObjectId(id) },
          { school: user.id },
          { deleted: false },
        ],
      });
      if (!existingStud) {
        const error = new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      await this.studModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { deleted: true } },
      );
      return responseMap({}, SUCCESS_MSGS.STUDENT_DELETED);
    } catch (err) {
      return err;
    }
  }

  async totalCount(user, query): globalResponse {
    try {
      const std = query.std || '';

      const school = query.school || '';

      const pipeline = [];

      pipeline.push({ $match: { deleted: false } });
      if (user.role == Role.Admin) {
        if (std || school) {
          if (std) {
            pipeline.push({ $match: { std: +std } });
          }
          if (school) {
            const existingSchool = await this.schoolService.findByName(school);

            pipeline.push({ $match: { school: existingSchool[0]._id } });
          }
        }
      } else if (user.role == Role.School) {
        if (std) {
          pipeline.push(
            { $match: { school: new mongoose.Types.ObjectId(user.id) } },
            { $match: { std: +std } },
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

      const count = totalCount[0].count;

      return responseMap({ count });
    } catch (err) {
      return err;
    }
  }
}

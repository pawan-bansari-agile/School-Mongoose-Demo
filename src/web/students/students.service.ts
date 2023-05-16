import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { School, SchoolDocument } from 'src/schemas/schools.schema';
import { Student, StudentDocument } from 'src/schemas/students.schema';
import Role, { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
import {
  CreateStudentDto,
  UpdateStatusDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';
import * as fs from 'fs';
// import { globalResponse, responseMap } from 'src/generics/genericResponse';
import { SchoolService } from '../school/school.service';
import { getFileUrl } from 'src/utils/utils';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studModel: Model<StudentDocument>,
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    private schoolService: SchoolService,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
    user: SchoolDocument,
    file: Express.Multer.File,
    id: string,
  ) {
    if (file) {
      createStudentDto.photo = file.filename;
    }
    const newStudent = new this.studModel(createStudentDto);
    if (user.role == 'Admin') {
      if (!id) {
        throw new BadRequestException('School not selected!');
      }
      const school = await this.schoolModel.findOne(
        { $and: [{ _id: id }, { deleted: false }] },
        { password: 0 },
      );
      if (!school) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      if (!school.standards.includes(newStudent.std)) {
        school.standards.push(newStudent.std);
        school.count += 1;
        await school.save();
      }
      newStudent.school = school;
    } else if (user.role == 'School') {
      const school = await this.schoolModel.findOne(
        { $and: [{ _id: user.id }, { deleted: false }] },
        { password: 0 },
      );
      if (!school.standards.includes(newStudent.std)) {
        school.standards.push(newStudent.std);
        school.count += 1;
        await school.save();
      }
      newStudent.school = user.id;
    }
    await newStudent.save();
    const filePath = file ? getFileUrl(file.filename, 'STUDENT_IMAGES') : '';
    newStudent.photo = filePath ? filePath : null;
    return { newStudent, message: SUCCESS_MSGS.STUDENT_CREATED };
  }

  async findAll(user, query) {
    const fieldName = query.fieldName || '';
    const fieldValue = query.fieldValue || '';
    const pageNumber = query.pageNumber || 1;
    const limit = query.limit || 10;
    const keyword = query.keyword || '';
    const regex = new RegExp(keyword, 'i');
    const sortBy = query.sortBy || '';
    const sortOrder = query.sortOrder || -1;
    const skip = (pageNumber - 1) * limit;
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
    pipeline.push(
      {
        $lookup: {
          from: 'schools',
          localField: 'school',
          foreignField: '_id',
          as: 'school',
        },
      },
      {
        $unwind: '$school',
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          parentNumber: 1,
          'school.name': 1,
          std: 1,
          photo: 1,
          dob: 1,
          status: 1,
          deleted: 1,
        },
      },
    );
    if (fieldName && fieldValue) {
      if (user.role == Role.Admin) {
        if (fieldName === 'school.name') {
          try {
            pipeline.push({
              $match: { [fieldName]: { $regex: fieldValue, $options: 'i' } },
            });
          } catch (err) {
            console.error('Invalid ObjectId for school field');
          }
        } else if (fieldName === 'std') {
          pipeline.push({ $match: { [fieldName]: +fieldValue } });
        }
      } else if (user.role == Role.School && fieldName === 'std') {
        pipeline.push({ $match: { [fieldName]: +fieldValue } });
      }
    }

    if (sortBy || sortOrder) {
      if (sortBy && sortOrder) {
        pipeline.push({ $sort: { [sortBy]: +sortOrder } });
      } else if (sortBy) {
        pipeline.push({ $sort: { [sortBy]: -1 } });
      } else if (sortOrder) {
        pipeline.push({ $sort: { std: +sortOrder } });
      }
    }

    pipeline.push(
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: +limit }],
          totalCount: [{ $count: 'total' }],
        },
      },
      {
        $project: {
          results: '$paginatedResults',
          totalCount: {
            $arrayElemAt: ['$totalCount.total', 0],
          },
        },
      },
    );

    const [{ results, totalCount }] = await this.studModel.aggregate(pipeline);
    if (!results) {
      throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
    }
    const studentUrl = results.map((item) => {
      const filename = item.photo;
      const url = filename ? getFileUrl(item.photo, 'STUDENT_IMAGES') : null;
      return {
        ...item,
        photo: url,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      studentUrl,
      pageNumber,
      limit,
      totalCount,
      totalPages,
      message: SUCCESS_MSGS.FIND_ALL_STUDENTS,
    };
  }

  async findOne(user, query) {
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

    if (existingStud.length === 0) {
      throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
    }
    const studentUrl = existingStud.map((item) => {
      const filename = item.photo;
      const url = filename ? getFileUrl(item.photo, 'STUDENT_IMAGES') : null;
      return {
        ...item,
        photo: url,
      };
    });
    return { studentUrl, message: SUCCESS_MSGS.FOUND_ONE_STUDENT };
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
    user,
    file: Express.Multer.File,
  ) {
    let existingStud;
    if (user.role == 'Admin') {
      existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { deleted: false }],
      });
    } else if (user.role == 'School') {
      existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
    }
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
    if (file) {
      existingStud.photo
        ? fs.unlink(`${file.destination}/${existingStud.photo}`, (err) => {
            if (err) {
            }
          })
        : null;
    }
    updatedDetails.photo = getFileUrl(updatedDetails.photo, 'STUDENT_IMAGES');
    return updatedDetails;
  }

  async isActive(id: string, user, body: UpdateStatusDto) {
    const status: boolean = body.status || false;
    let existingStud;
    if (user.role == 'Admin') {
      existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { deleted: false }],
      });
    } else if (user.role == 'School') {
      existingStud = await this.studModel.findOne({
        $and: [{ _id: id }, { school: user.id }, { deleted: false }],
      });
    }
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
    updatedDetails.photo = getFileUrl(updatedDetails.photo, 'SCHOOL_IMAGES');
    return { updatedDetails, message: SUCCESS_MSGS.STATUS_CHANGED };
  }

  async remove(user: SchoolDocument, id: string) {
    let existingStud;
    if (user.role == 'Admin') {
      existingStud = await this.studModel.findOne({
        $and: [{ _id: new mongoose.Types.ObjectId(id) }, { deleted: false }],
      });
    } else if (user.role == 'School') {
      existingStud = await this.studModel.findOne({
        $and: [
          { _id: new mongoose.Types.ObjectId(id) },
          { school: user.id },
          { deleted: false },
        ],
      });
    }
    if (!existingStud) {
      throw new BadRequestException(ERR_MSGS.STUDENT_NOT_FOUND);
    }
    await this.studModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { deleted: true } },
    );
    return { message: SUCCESS_MSGS.STUDENT_DELETED };
  }

  async totalCount(user, query) {
    let std: number[];

    const school = query.school || '';

    const pipeline = [];

    pipeline.push({ $match: { deleted: false } });
    if (user.role == Role.Admin) {
      const existingSchool = await this.schoolService.findByName(school);

      std = existingSchool[0].standards;
      if (!std) {
        throw new BadRequestException(
          'No Standards Found for the selected school',
        );
      }

      pipeline.push({ $match: { std: { $in: std } } });
      pipeline.push({ $group: { _id: '$std', count: { $sum: 1 } } });
      pipeline.push({ $sort: { _id: 1 } });
    } else if (user.role == Role.School) {
      const school = await this.schoolModel.findOne(
        { $and: [{ _id: user.id }, { deleted: false }] },
        { password: 0 },
      );

      std = school.standards;
      if (!std) {
        throw new BadRequestException(
          'No Standards Found for the selected school',
        );
      }
      pipeline.push({ $match: { std: { $in: std } } });
      pipeline.push({ $group: { _id: '$std', count: { $sum: 1 } } });
      pipeline.push({ $sort: { _id: 1 } });
    }

    const totalCount = await this.studModel.aggregate(pipeline);

    return totalCount;
  }

  async totalStudentCount() {
    const totalStudentCount = await this.studModel.aggregate([
      { $match: { deleted: false } },
      { $count: 'total' },
    ]);

    return totalStudentCount;
  }

  async getAllStds() {
    const standards = await this.studModel.aggregate([
      { $match: { deleted: false } },
      {
        $project: {
          _id: 0,
          std: 1,
        },
      },
    ]);

    return standards;
  }
}

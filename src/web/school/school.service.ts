import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from 'src/schemas/schools.schema';
import Role, { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
import { hashPassword, JwtHelper, verifyPass } from 'src/utils/utils';
import {
  CreateSchoolDto,
  ForgetSchoolPassDto,
  LoginSchoolDto,
  ResetSchoolPassDto,
  UpdateSchoolDto,
} from '../../dto/create-school.dto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { globalResponse, responseMap } from 'src/generics/genericResponse';

@Injectable()
export class SchoolService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    private mailerService: MailerService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    file: Express.Multer.File,
  ): globalResponse {
    try {
      const existingSchool = await this.schoolModel.findOne({
        email: createSchoolDto.email,
      });
      if (existingSchool && existingSchool.deleted == false) {
        throw new BadRequestException(ERR_MSGS.EMAIL_ALREADY_USED);
      }
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(password);
      createSchoolDto.photo = file?.filename;
      const newSchool = new this.schoolModel({
        ...createSchoolDto,
        password: hashedPassword,
      });
      await newSchool.save();
      const payload = {
        id: newSchool._id,
        email: newSchool.email,
        role: newSchool.role,
      };
      const access_token = await this.jwtHelper.sign(payload);
      const user = newSchool.toObject();
      delete user.password;
      this.mailerService.sendMail({
        to: newSchool.email,
        subject: 'Successfull Registration!',
        template: 'password',
        context: {
          name: newSchool.name,
          username: newSchool.email,
          password: password,
          default: 'Pawan',
        },
      });
      return responseMap({ access_token, user }, SUCCESS_MSGS.SCHOOL_CREATED);
    } catch (err) {
      return err;
    }
  }

  async login(loginDetails: LoginSchoolDto): globalResponse {
    try {
      const user = await this.schoolModel.findOne({
        $and: [
          {
            email: loginDetails.email,
          },
          {
            deleted: false,
          },
        ],
      });
      if (!user) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      if (!(await verifyPass(loginDetails.password, user.password))) {
        throw new UnauthorizedException(ERR_MSGS.BAD_CREDS);
      }
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
      };
      const access_token = await this.jwtHelper.sign(payload);
      return responseMap({ access_token, user }, SUCCESS_MSGS.SCHL_LOGGED_IN);
    } catch (err) {
      return err;
    }
  }

  async forget(forgetPassDetails: ForgetSchoolPassDto, req): globalResponse {
    try {
      const existingSchool = await this.schoolModel.findOne({
        $and: [
          {
            email: forgetPassDetails.email,
          },
          {
            deleted: false,
          },
        ],
      });
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.EMAIL_NOT_LINKED);
      }
      const token = crypto.randomBytes(20).toString('hex');
      const link =
        'http://' + req.headers.host + '/school/reset?token=' + token;
      this.mailerService.sendMail({
        to: existingSchool.email,
        subject: 'Forget Password Request!',
        template: 'resetPwd',
        context: {
          name: existingSchool.name,
          buttonLink: link,
          buttonText: 'RESET',
        },
      });
      existingSchool.forgetPwdToken = token;
      existingSchool.forgetPwdExpires = new Date(
        Date.now() + 600000,
      ).toUTCString();
      await existingSchool.save();
      return responseMap({}, SUCCESS_MSGS.MAIL_SENT);
    } catch (err) {
      return err;
    }
  }

  async reset(
    resetPassDetails: ResetSchoolPassDto,
    user: SchoolDocument,
    token: string,
  ): globalResponse {
    try {
      let existingSchool: SchoolDocument;
      if (!token) {
        existingSchool = await this.schoolModel.findOne({
          $and: [{ _id: user?.id }, { deleted: false }],
        });
      } else {
        existingSchool = await this.schoolModel.findOne({
          $and: [
            { forgetPwdToken: token },
            { forgetPwdExpires: { $gte: new Date() } },
            { deleted: false },
          ],
        });
      }
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.LINK_EXPIRED);
      }
      if (resetPassDetails.newPass !== resetPassDetails.confirmPass) {
        throw new BadRequestException(ERR_MSGS.PWD_DONT_MATCH);
      }
      const hashedPwd = await hashPassword(resetPassDetails.newPass);
      existingSchool.password = hashedPwd;
      existingSchool.forgetPwdToken = null;
      existingSchool.forgetPwdExpires = null;
      await existingSchool.save();
      return responseMap({}, SUCCESS_MSGS.PWD_CHANGED);
    } catch (err) {
      return err;
    }
  }

  async findAll(query): globalResponse {
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
      if (keyword) {
        pipeline.push(
          { $match: { name: { $regex: regex } } },
          { $match: { deleted: false } },
        );
      } else {
        pipeline.push({ $match: { deleted: false } });
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
      const schools = await this.schoolModel.aggregate(pipeline);
      if (!schools) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      return responseMap(schools, SUCCESS_MSGS.FIND_ALL_SCHOOLS);
    } catch (err) {
      return err;
    }
  }

  async findOne(id: string): globalResponse {
    try {
      const existingSchool = await this.schoolModel.findOne(
        { $and: [{ _id: id }, { deleted: false }] },
        { password: 0 },
      );
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      return responseMap({ existingSchool }, SUCCESS_MSGS.FOUND_ONE_SCHOOL);
    } catch (err) {
      return err;
    }
  }

  async update(
    updateUserDto: UpdateSchoolDto,
    user: SchoolDocument,
    file: Express.Multer.File,
  ): globalResponse {
    try {
      const existingSchool = await this.schoolModel.findOne({
        $and: [{ _id: user.id }, { deleted: false }],
      });
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      if (file) {
        updateUserDto.photo = file.filename;
      }
      const updatedDetails = await this.schoolModel.findOneAndUpdate(
        { _id: user.id },
        {
          $set: {
            name: updateUserDto?.name,
            email: updateUserDto?.email,
            address: updateUserDto?.address,
            photo: updateUserDto?.photo,
            zipCode: updateUserDto?.zipCode,
            city: updateUserDto?.city,
            state: updateUserDto?.state,
            country: updateUserDto?.country,
          },
        },
        { projection: { password: 0 }, new: true },
      );
      existingSchool.photo
        ? fs.unlink(`${file.destination}/${existingSchool.photo}`, (err) => {
            if (err) {
              console.log('File error', err);
            }
          })
        : null;
      return responseMap({ updatedDetails }, SUCCESS_MSGS.UPDATED_SCHOOL);
    } catch (err) {
      return err;
    }
  }

  async remove(user: SchoolDocument, schlId: string): globalResponse {
    try {
      let existingSchool = {};
      if (user.role == Role.School) {
        existingSchool = await this.schoolModel.findOne({
          $and: [{ _id: user.id }, { deleted: false }],
        });
      } else if (user.role == Role.Admin) {
        existingSchool = await this.schoolModel.findOne({
          $and: [{ _id: schlId }, { deleted: false }],
        });
      }
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      await this.schoolModel.findOneAndUpdate(
        { _id: user.id },
        { $set: { deleted: true } },
      );
      return responseMap({}, SUCCESS_MSGS.SCHOOL_DELETED);
    } catch (err) {
      return err;
    }
  }
}

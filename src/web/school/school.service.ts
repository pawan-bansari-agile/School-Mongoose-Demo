import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from 'src/schemas/schools.schema';
import { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
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

@Injectable()
export class SchoolService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    private mailerService: MailerService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async create(createSchoolDto: CreateSchoolDto, file: Express.Multer.File) {
    try {
      const existingSchool = await this.schoolModel.findOne({
        email: createSchoolDto.email,
      });
      if (existingSchool && existingSchool.deleted == false) {
        throw new BadRequestException(ERR_MSGS.EMAIL_ALREADY_USED);
      }
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(password);
      const newSchool = new this.schoolModel({
        ...createSchoolDto,
        password: hashedPassword,
      });
      newSchool.photo = file?.filename;
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
      return { access_token, user };
    } catch (err) {
      return err;
    }
  }

  async login(loginDetails: LoginSchoolDto) {
    try {
      const existingSchool = await this.schoolModel.findOne({
        $and: [
          {
            email: loginDetails.email,
          },
          {
            deleted: false,
          },
        ],
      });
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.SCHOOL_NOT_FOUND);
      }
      if (!(await verifyPass(loginDetails.password, existingSchool.password))) {
        throw new UnauthorizedException(ERR_MSGS.BAD_CREDS);
      }
      const payload = {
        id: existingSchool._id,
        email: existingSchool.email,
        role: existingSchool.role,
      };
      const access_token = await this.jwtHelper.sign(payload);
      return { access_token, existingSchool };
    } catch (err) {
      return err;
    }
  }

  async forget(forgetPassDetails: ForgetSchoolPassDto, req) {
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
      const link = 'http://' + req.headers.host + '/users/reset?token=' + token;
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
      return SUCCESS_MSGS.MAIL_SENT;
    } catch (err) {
      return err;
    }
  }

  async reset(
    resetPassDetails: ResetSchoolPassDto,
    user: SchoolDocument,
    token: string,
  ) {
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
      return SUCCESS_MSGS.PWD_CHANGED;
    } catch (err) {
      return err;
    }
  }

  async findAll(query) {
    try {
      const skip = query.skip || 0;
      const limit = query.limit || 10;
      const keyword: RegExp = query.keyword || '';
      // const schools = await this.schoolModel.find(
      //   { deleted: false },
      //   { password: 0 },
      // );
      const schools = await this.schoolModel.aggregate([
        { $match: { deleted: false } },
        { $match: { $or: [{ name: keyword }, {}] } },
      ]);
      return { message: SUCCESS_MSGS.FIND_ALL_USERS, schools };
    } catch (err) {
      return err;
    }
  }

  async findOne(id: string) {
    try {
      const existingSchool = await this.schoolModel.findOne(
        { $and: [{ _id: id }, { deleted: false }] },
        { password: 0 },
      );
      return { existingSchool, message: SUCCESS_MSGS.FOUND_ONE_SCHOOL };
    } catch (err) {
      return err;
    }
  }

  async update(
    updateUserDto: UpdateSchoolDto,
    user: SchoolDocument,
    file: Express.Multer.File,
  ) {
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
      return { updatedDetails, message: SUCCESS_MSGS.UPDATED_SCHOOL };
    } catch (err) {
      return err;
    }
  }

  async remove(user: SchoolDocument) {
    try {
      const existingSchool = await this.schoolModel.findOne({
        $and: [{ _id: user.id }, { deleted: false }],
      });
      if (!existingSchool) {
        throw new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
      }
      await this.schoolModel.findOneAndUpdate(
        { _id: user.id },
        { $set: { deleted: true } },
      );
    } catch (err) {
      return err;
    }
  }
}

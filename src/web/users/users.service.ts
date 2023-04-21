import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ERR_MSGS, SUCCESS_MSGS } from 'src/utils/consts';
import { hashPassword, JwtHelper, verifyPass } from 'src/utils/utils';
import {
  CreateUserDto,
  ForgetPassDto,
  LoginUserDto,
  ResetPassDto,
  UpdateUserDto,
} from '../../dto/create-user.dto';
import * as crypto from 'crypto';
import { globalResponse, responseMap } from 'src/generics/genericResponse';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailerService: MailerService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async create(createUserDto: CreateUserDto): globalResponse {
    try {
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser && existingUser.deleted == false) {
        const error = new BadRequestException(ERR_MSGS.EMAIL_ALREADY_USED);
        return responseMap({}, '', { error });
      }
      const password = Math.random().toString(36).slice(-8);

      const hashedPassword = await hashPassword(password);
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });
      await newUser.save();
      const payload = {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      };
      const access_token = await this.jwtHelper.sign(payload);
      const user = newUser.toObject();
      delete user.password;
      this.mailerService.sendMail({
        to: newUser.email,
        subject: 'Successfull Registration!',
        template: 'password',
        context: {
          name: newUser.userName,
          username: newUser.email,
          password: password,
          default: 'Pawan',
        },
      });
      return responseMap({ access_token, user }, SUCCESS_MSGS.USER_CREATED);
    } catch (err) {
      return err;
    }
  }

  async login(loginDetails: LoginUserDto): globalResponse {
    try {
      const user = await this.userModel.findOne({
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
        const error = new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      if (!(await verifyPass(loginDetails.password, user.password))) {
        const error = new UnauthorizedException(ERR_MSGS.BAD_CREDS);
        return responseMap({}, '', { error });
      }
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
      };
      const access_token = await this.jwtHelper.sign(payload);
      return responseMap({ access_token, user }, SUCCESS_MSGS.LOGGED_IN);
    } catch (err) {
      return err;
    }
  }

  async forget(forgetPassDetails: ForgetPassDto, req): globalResponse {
    try {
      const existingUser = await this.userModel.findOne({
        $and: [
          {
            email: forgetPassDetails.email,
          },
          {
            deleted: false,
          },
        ],
      });
      if (!existingUser) {
        throw new BadRequestException(ERR_MSGS.EMAIL_NOT_LINKED);
      }
      const token = crypto.randomBytes(20).toString('hex');
      const link = 'http://' + req.headers.host + '/users/reset?token=' + token;
      this.mailerService.sendMail({
        to: existingUser.email,
        subject: 'Forget Password Request!',
        template: 'resetPwd',
        context: {
          name: existingUser.userName,
          buttonLink: link,
          buttonText: 'RESET',
        },
      });
      existingUser.forgetPwdToken = token;
      existingUser.forgetPwdExpires = new Date(
        Date.now() + 600000,
      ).toUTCString();
      await existingUser.save();
      return responseMap({}, SUCCESS_MSGS.MAIL_SENT);
    } catch (err) {
      return err;
    }
  }

  async reset(
    resetPassDetails: ResetPassDto,
    user: UserDocument,
    token: string,
  ): globalResponse {
    try {
      let existingUser: UserDocument;
      if (!token) {
        existingUser = await this.userModel.findOne({
          $and: [{ _id: user?.id }, { deleted: false }],
        });
      } else {
        existingUser = await this.userModel.findOne({
          $and: [
            { forgetPwdToken: token },
            { forgetPwdExpires: { $gte: new Date() } },
            { deleted: false },
          ],
        });
      }
      if (!existingUser) {
        throw new BadRequestException(ERR_MSGS.LINK_EXPIRED);
      }
      if (resetPassDetails.newPass !== resetPassDetails.confirmPass) {
        throw new BadRequestException(ERR_MSGS.PWD_DONT_MATCH);
      }
      const hashedPwd = await hashPassword(resetPassDetails.newPass);
      existingUser.password = hashedPwd;
      existingUser.forgetPwdToken = null;
      existingUser.forgetPwdExpires = null;
      await existingUser.save();
      return responseMap({}, SUCCESS_MSGS.PWD_CHANGED);
    } catch (err) {
      return err;
    }
  }

  async findAll(): globalResponse {
    try {
      const users = await this.userModel.find(
        { deleted: false },
        { password: 0 },
      );
      return responseMap(users, SUCCESS_MSGS.FIND_ALL_USERS);
    } catch (err) {
      return err;
    }
  }

  async findOne(id: string): globalResponse {
    try {
      const existingUser = await this.userModel.findOne(
        { $and: [{ _id: id }, { deleted: false }] },
        { password: 0 },
      );
      return responseMap({ existingUser }, SUCCESS_MSGS.FOUND_ONE_USER);
    } catch (err) {
      return err;
    }
  }

  async update(
    updateUserDto: UpdateUserDto,
    user: UserDocument,
  ): globalResponse {
    try {
      const existingUser = await this.userModel.findOne({
        $and: [{ _id: user.id }, { deleted: false }],
      });
      if (!existingUser) {
        const error = new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      const updatedDetails = await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          $set: {
            userName: updateUserDto?.userName,
            email: updateUserDto?.email,
          },
        },
        { projection: { password: 0 }, new: true },
      );
      return responseMap({ updatedDetails }, SUCCESS_MSGS.UPDATED_USER);
    } catch (err) {
      return err;
    }
  }

  async remove(user: UserDocument): globalResponse {
    try {
      const existingUser = await this.userModel.findOne({
        $and: [{ _id: user.id }, { deleted: false }],
      });
      if (!existingUser) {
        const error = new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
        return responseMap({}, '', { error });
      }
      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        { $set: { deleted: true } },
      );
      return responseMap({}, SUCCESS_MSGS.USER_DELETED);
    } catch (err) {
      return err;
    }
  }
}

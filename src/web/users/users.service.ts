import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import Role, { ERR_MSGS, SUCCESS_MSGS, initialUser } from 'src/utils/consts';
import { hashPassword, JwtHelper, verifyPass } from 'src/utils/utils';
import {
  CreateUserDto,
  ForgetPassDto,
  LoginUserDto,
  ResetPassDto,
  UpdateUserDto,
} from '../../dto/create-user.dto';
import * as crypto from 'crypto';
// import { globalResponse, responseMap } from 'src/generics/genericResponse';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailerService: MailerService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  async createInitialUser() {
    try {
      const existingUser = await this.userModel.findOne({
        email: initialUser.email,
      });

      if (existingUser) {
        console.warn('Initial user already exists!');
      } else {
        const params: CreateUserDto = {
          userName: initialUser.userName,
          email: initialUser.email,
          role: Role.Admin,
        };
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(password);
        const newUser = new this.userModel({
          ...params,
          password: hashedPassword,
        });
        await newUser.save();
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
        console.warn('Initial user loaded successfully!');
      }
    } catch (err) {
      err.message
        ? console.warn(err.message)
        : console.warn('Something went wrong! Please try again!');
    }
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser && existingUser.deleted == false) {
      throw new BadRequestException(ERR_MSGS.EMAIL_ALREADY_USED);
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
    return { access_token, user, message: SUCCESS_MSGS.USER_CREATED };
  }

  async login(loginDetails: LoginUserDto) {
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
      throw new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
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
    return { access_token, user, message: SUCCESS_MSGS.LOGGED_IN };
  }

  async forget(forgetPassDetails: ForgetPassDto, req) {
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
    existingUser.forgetPwdExpires = new Date(Date.now() + 600000).toUTCString();
    await existingUser.save();
    return { message: SUCCESS_MSGS.MAIL_SENT };
  }

  async reset(
    resetPassDetails: ResetPassDto,
    user: UserDocument,
    token: string,
  ) {
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
    return { message: SUCCESS_MSGS.PWD_CHANGED };
  }

  async findAll() {
    const users = await this.userModel.find(
      { deleted: false },
      { password: 0 },
    );
    return { users, message: SUCCESS_MSGS.FIND_ALL_USERS };
  }

  async findOne(id: string) {
    const existingUser = await this.userModel.findOne(
      { $and: [{ _id: id }, { deleted: false }] },
      { password: 0 },
    );
    if (!existingUser) {
      throw new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
    }
    return { existingUser, message: SUCCESS_MSGS.FOUND_ONE_USER };
  }

  async update(updateUserDto: UpdateUserDto, user: UserDocument) {
    const existingUser = await this.userModel.findOne({
      $and: [{ _id: user.id }, { deleted: false }],
    });
    if (!existingUser) {
      throw new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
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
    return { updatedDetails, message: SUCCESS_MSGS.UPDATED_USER };
  }

  async remove(user: UserDocument) {
    const existingUser = await this.userModel.findOne({
      $and: [{ _id: user.id }, { deleted: false }],
    });
    if (!existingUser) {
      throw new BadRequestException(ERR_MSGS.USER_NOT_FOUND);
    }
    await this.userModel.findOneAndUpdate(
      { _id: user.id },
      { $set: { deleted: true } },
    );
    return { message: SUCCESS_MSGS.USER_DELETED };
  }
}

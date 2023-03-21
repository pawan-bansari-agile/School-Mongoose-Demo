import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  ForgetPassDto,
  LoginUserDto,
  ResetPassDto,
  UpdateUserDto,
} from '../../dto/create-user.dto';
import { UserDocument } from 'src/schemas/user.schema';
import { JwtAuthGuard } from 'src/guards/jwtAuthGuard.guard';
import { Users } from 'src/decorators/user.decorator';
import { ValidateObjectId } from 'src/utils/utils';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role from 'src/utils/consts';
import { globalResponse } from 'src/generics/genericResponse';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto): globalResponse {
    return await this.usersService.create(createUserDto);
  }

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDetails: LoginUserDto): globalResponse {
    return await this.usersService.login(loginDetails);
  }

  @Post('forget')
  @UsePipes(ValidationPipe)
  async forget(
    @Body() forgetPassDetails: ForgetPassDto,
    @Req() req,
  ): globalResponse {
    return await this.usersService.forget(forgetPassDetails, req);
  }

  @Post('reset')
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  async reset(
    @Body() resetPassDetails: ResetPassDto,
    @Users() user: UserDocument,
    @Query('token') token: string,
  ): globalResponse {
    return await this.usersService.reset(resetPassDetails, user, token);
  }

  @Get('findAll')
  @UseGuards(RoleGuard(Role.Admin))
  findAll(): globalResponse {
    return this.usersService.findAll();
  }

  @Get('findone/:id')
  @UseGuards(RoleGuard(Role.Admin))
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): globalResponse {
    return this.usersService.findOne(id);
  }

  @Patch('update')
  @UsePipes(ValidationPipe)
  @UseGuards(RoleGuard([Role.Admin, Role.Reader]))
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Users() user: UserDocument,
  ): globalResponse {
    return this.usersService.update(updateUserDto, user);
  }

  @Delete('delete')
  @UseGuards(RoleGuard([Role.Admin, Role.Reader]))
  async remove(@Users() user: UserDocument): globalResponse {
    return this.usersService.remove(user);
  }
}

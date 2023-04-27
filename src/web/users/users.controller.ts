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
import { User, UserDocument } from 'src/schemas/user.schema';
import { JwtAuthGuard } from 'src/guards/jwtAuthGuard.guard';
import { Users } from 'src/decorators/user.decorator';
// import { ValidateObjectId } from 'src/utils/utils';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role from 'src/utils/consts';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// import { globalResponse } from 'src/generics/genericResponse';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Email already exists!',
  })
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully authenticated.',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'User not found!',
  })
  @UsePipes(ValidationPipe)
  async login(@Body() loginDetails: LoginUserDto) {
    return await this.usersService.login(loginDetails);
  }

  @Post('forget')
  @ApiOperation({ summary: 'Initiate a password reset' })
  @ApiBody({ type: ForgetPassDto })
  @ApiResponse({
    status: 200,
    description: 'A password reset email has been sent to the user.',
  })
  @UsePipes(ValidationPipe)
  async forget(@Body() forgetPassDetails: ForgetPassDto, @Req() req) {
    return await this.usersService.forget(forgetPassDetails, req);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiBody({ type: ResetPassDto })
  @ApiParam({
    name: 'token',
    required: true,
    description: 'The password reset token sent to the user.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The user password has been successfully reset.',
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  async reset(
    @Body() resetPassDetails: ResetPassDto,
    @Users() user: UserDocument,
    @Query('token') token: string,
  ) {
    return await this.usersService.reset(resetPassDetails, user, token);
  }

  @Get('findAll')
  @ApiOperation({ summary: 'Get all users' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'All users fetched successfully.',
    type: [User],
  })
  @UseGuards(RoleGuard(Role.Admin))
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('findone/:id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ type: User })
  @ApiBadRequestResponse({ description: 'User not found!' })
  @UseGuards(RoleGuard(Role.Admin))
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('update')
  @ApiBearerAuth()
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ type: User })
  @ApiBadRequestResponse({ description: 'User not found!' })
  @UsePipes(ValidationPipe)
  @UseGuards(RoleGuard([Role.Admin, Role.Reader]))
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Users() user: UserDocument,
  ) {
    return this.usersService.update(updateUserDto, user);
  }

  @Delete('delete')
  @ApiBearerAuth()
  @ApiResponse({ description: 'User deleted!' })
  @ApiBadRequestResponse({ description: 'User not found!' })
  @UseGuards(RoleGuard([Role.Admin, Role.Reader]))
  async remove(@Users() user: UserDocument) {
    return this.usersService.remove(user);
  }
}

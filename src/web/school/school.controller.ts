import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import {
  CreateSchoolDto,
  ForgetSchoolPassDto,
  LoginSchoolDto,
  ResetSchoolPassDto,
  UpdateSchoolDto,
} from '../../dto/create-school.dto';
import { Users } from 'src/decorators/user.decorator';
import { JwtAuthGuard } from 'src/guards/jwtAuthGuard.guard';
import { School, SchoolDocument } from 'src/schemas/schools.schema';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role, { SchoolStorage } from 'src/utils/consts';
// import { ValidateObjectId } from 'src/utils/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserDocument } from 'src/schemas/user.schema';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
// import { globalResponse } from 'src/generics/genericResponse';

@ApiTags('Schools')
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new school' })
  @ApiCreatedResponse({
    description: 'Created a school onject!',
    type: School,
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'Email already used!',
  })
  @ApiBody({ type: CreateSchoolDto })
  @UseGuards(RoleGuard(Role.Admin))
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('file', SchoolStorage))
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.schoolService.create(createSchoolDto, file);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiOkResponse({
    description: 'School logged in successfully!',
    type: School,
  })
  @ApiBody({ type: LoginSchoolDto })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'School not found!',
  })
  @ApiUnauthorizedResponse({
    description: 'Bad credentials!',
  })
  @UsePipes(ValidationPipe)
  async login(@Body() loginDetails: LoginSchoolDto) {
    return await this.schoolService.login(loginDetails);
  }

  @Post('forget')
  @ApiOperation({ summary: 'Initiate a password reset' })
  @ApiBody({ type: ForgetSchoolPassDto })
  @ApiOkResponse({
    description: 'Mail sent!',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'Email not linked!',
  })
  @UsePipes(ValidationPipe)
  async forget(@Body() forgetPassDetails: ForgetSchoolPassDto, @Req() req) {
    return await this.schoolService.forget(forgetPassDetails, req);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiOkResponse({
    description: 'Password changed succesfully!',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'Link expired/Passwords dont match!',
  })
  @ApiBody({ type: ResetSchoolPassDto })
  @ApiQuery({ name: 'token', required: true })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  async reset(
    @Body() resetPassDetails: ResetSchoolPassDto,
    @Users() user: SchoolDocument,
    @Query('token') token: string,
  ) {
    return await this.schoolService.reset(resetPassDetails, user, token);
  }

  @Get('findAll')
  @ApiOperation({ summary: 'Get all schools' })
  @ApiOkResponse({
    description: 'Found all schools!',
    type: [School],
  })
  @ApiBadRequestResponse({
    description: 'School details not found!',
  })
  @ApiBearerAuth()
  @ApiQuery({ name: 'fieldName', required: false })
  @ApiQuery({ name: 'fieldValue', required: false })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @UseGuards(RoleGuard(Role.Admin))
  async findAll(@Query() query) {
    return this.schoolService.findAll(query);
  }

  @Get('findone/:id')
  @ApiOperation({ summary: 'Get one school' })
  @ApiOkResponse({
    description: 'Found one school!',
    type: School,
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'School not found!',
  })
  @ApiParam({ name: 'id', required: true })
  @UseGuards(RoleGuard(Role.Admin))
  async findOne(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Get('findByName')
  @ApiOperation({ summary: 'Get one school by name' })
  @ApiBadRequestResponse({
    description: 'School not found!',
  })
  @ApiQuery({ name: 'name', required: true })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'School Found!', type: School })
  @UseGuards(RoleGuard(Role.Admin))
  async findByName(@Query() name: string) {
    await this.schoolService.findByName(name);
  }

  @Patch('update')
  @ApiOperation({ summary: 'Get school and update' })
  @ApiOkResponse({
    description: 'School updated!',
    type: School,
  })
  @ApiBody({ type: UpdateSchoolDto })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'School not found!',
  })
  @ApiQuery({ name: 'id', required: true })
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('file', SchoolStorage))
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async update(
    @Body() updateSchoolDto: UpdateSchoolDto,
    @Users() user,
    @UploadedFile() file: Express.Multer.File,
    @Query('id') id: string,
  ) {
    return this.schoolService.update(updateSchoolDto, user, id, file);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Get school and soft delete' })
  @ApiCreatedResponse({
    description: 'School deleted!',
  })
  @ApiBearerAuth()
  @ApiBadRequestResponse({
    description: 'School not found!',
  })
  @ApiQuery({ name: 'id', required: true })
  @UseGuards(RoleGuard(Role.Admin))
  async remove(@Users() user: UserDocument, @Query('id') id: string) {
    return this.schoolService.remove(user, id);
  }

  @Get('findAll/cities')
  @ApiOperation({ summary: 'Get all available cities!' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Will return a list of all the cities!',
  })
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async availableCities() {
    return this.schoolService.getCities();
  }

  @Get('getAll/schools')
  @ApiOperation({ summary: 'Get all school names' })
  @ApiOkResponse({
    description: 'Will return a list of all the school names!',
  })
  @ApiBearerAuth()
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async getAllSchools() {
    return this.schoolService.getAllSchools();
  }
}

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
import { SchoolDocument } from 'src/schemas/schools.schema';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role, { SchoolStorage } from 'src/utils/consts';
import { ValidateObjectId } from 'src/utils/utils';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('create')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('file', SchoolStorage))
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.schoolService.create(createSchoolDto, file);
  }

  @Post('login')
  @UsePipes(ValidationPipe)
  async login(@Body() loginDetails: LoginSchoolDto) {
    return await this.schoolService.login(loginDetails);
  }

  @Post('forget')
  @UsePipes(ValidationPipe)
  async forget(@Body() forgetPassDetails: ForgetSchoolPassDto, @Req() req) {
    return await this.schoolService.forget(forgetPassDetails, req);
  }

  @Post('reset')
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
  @UseGuards(RoleGuard(Role.Admin))
  findAll(@Query() query) {
    return this.schoolService.findAll(query);
  }

  @Get('findone/:id')
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async findOne(@Param('id', new ValidateObjectId()) id: string) {
    return this.schoolService.findOne(id);
  }

  @Patch('update')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('file', SchoolStorage))
  @UseGuards(RoleGuard(Role.School))
  async update(
    @Body() updateSchoolDto: UpdateSchoolDto,
    @Users() user: SchoolDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.schoolService.update(updateSchoolDto, user, file);
  }

  @Delete('delete')
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async remove(@Users() user: SchoolDocument, @Query() schlId: string) {
    return this.schoolService.remove(user, schlId);
  }
}

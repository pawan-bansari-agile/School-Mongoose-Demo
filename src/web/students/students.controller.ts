import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  UpdateStatusDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role, { StudentStorage } from 'src/utils/consts';
import { FileInterceptor } from '@nestjs/platform-express';
import { Users } from 'src/decorators/user.decorator';
import { SchoolDocument } from 'src/schemas/schools.schema';
import { ValidateObjectId } from 'src/utils/utils';
import { globalResponse } from 'src/generics/genericResponse';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file', StudentStorage))
  @UsePipes(ValidationPipe)
  @UseGuards(RoleGuard(Role.School))
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @Users() user: SchoolDocument,
    @UploadedFile() file: Express.Multer.File,
  ): globalResponse {
    return this.studentsService.create(createStudentDto, user, file);
  }

  @Get('findAll')
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findAll(@Users() user, @Query() query): globalResponse {
    return this.studentsService.findAll(user, query);
  }

  @Get('findOne')
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findOne(@Users() user, @Query() query): globalResponse {
    return this.studentsService.findOne(user, query);
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('file', StudentStorage))
  @UseGuards(RoleGuard(Role.School))
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Users() user: SchoolDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.update(id, updateStudentDto, user, file);
  }

  @Patch('update/isActive/:id')
  @UseGuards(RoleGuard(Role.School))
  async isActive(
    @Param('id', new ValidateObjectId()) id: string,
    @Users() user: SchoolDocument,
    @Body() body: UpdateStatusDto,
  ): globalResponse {
    return this.studentsService.isActive(id, user, body);
  }

  @Delete('delete/:id')
  @UseGuards(RoleGuard(Role.School))
  async remove(
    @Users() user: SchoolDocument,
    @Param() id: string,
  ): globalResponse {
    return this.studentsService.remove(user, id);
  }

  @Get('totalCount')
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async totalCount(@Users() user, @Query() query): globalResponse {
    return this.studentsService.totalCount(user, query);
  }
}

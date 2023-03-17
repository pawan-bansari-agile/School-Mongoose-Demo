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
} from '@nestjs/common';
import { StudentsService } from './students.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from '../../dto/create-student.dto';
import RoleGuard from 'src/guards/roleGuard.guard';
import Role, { StudentStorage } from 'src/utils/consts';
import { FileInterceptor } from '@nestjs/platform-express';
import { Users } from 'src/decorators/user.decorator';
import { SchoolDocument } from 'src/schemas/schools.schema';

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
  ) {
    return this.studentsService.create(createStudentDto, user, file);
  }

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }
}

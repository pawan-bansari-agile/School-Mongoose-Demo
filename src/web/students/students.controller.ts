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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Student } from 'src/schemas/students.schema';
// import { SchoolDocument } from 'src/schemas/schools.schema';
// import { ValidateObjectId } from 'src/utils/utils';
// import { globalResponse } from 'src/generics/genericResponse';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('create')
  @ApiBearerAuth()
  @ApiBody({ type: CreateStudentDto })
  @ApiParam({ name: 'id', required: false })
  @ApiOkResponse({ description: 'Created' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @UseInterceptors(FileInterceptor('file', StudentStorage))
  @UsePipes(ValidationPipe)
  @ApiResponse({ type: Student })
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @Users() user,
    @UploadedFile() file: Express.Multer.File,
    @Query('id') id: string,
  ) {
    return this.studentsService.create(createStudentDto, user, file, id);
  }

  @Get('findAll')
  @ApiBearerAuth()
  @ApiQuery({ name: 'fieldName', required: false })
  @ApiQuery({ name: 'fieldValue', required: false })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiOkResponse({ description: 'Found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiResponse({ type: [Student] })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findAll(@Users() user, @Query() query) {
    return this.studentsService.findAll(user, query);
  }

  @Get('findOne')
  @ApiBearerAuth()
  @ApiQuery({ name: 'id', required: true })
  @ApiQuery({ name: 'name', required: true })
  @ApiOkResponse({ description: 'Found' })
  @ApiNotFoundResponse({ description: 'Not Found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiResponse({ type: Student })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findOne(@Users() user, @Query() query) {
    return this.studentsService.findOne(user, query);
  }

  @Patch('update/:id')
  @ApiBearerAuth()
  @ApiBody({ type: UpdateStudentDto })
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Updated' })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not Found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiResponse({ type: Student })
  @UseInterceptors(FileInterceptor('file', StudentStorage))
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Users() user,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.update(id, updateStudentDto, user, file);
  }

  @Patch('update/isActive/:id')
  @ApiBearerAuth()
  @ApiBody({ type: UpdateStatusDto })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns updated student',
    type: Student,
  })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async isActive(
    @Param('id') id: string,
    @Users() user,
    @Body() body: UpdateStatusDto,
  ) {
    return this.studentsService.isActive(id, user, body);
  }

  @Delete('delete/:id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns deleted student',
    type: Student,
  })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async remove(@Users() user, @Param() id: string) {
    return this.studentsService.remove(user, id);
  }

  @Get('totalCount')
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'Returns total count of students',
    type: Number,
  })
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async totalCount(@Users() user, @Query() query) {
    return this.studentsService.totalCount(user, query);
  }
}

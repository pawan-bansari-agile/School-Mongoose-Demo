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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Student } from 'src/schemas/students.schema';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new student' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateStudentDto })
  @ApiQuery({ name: 'id', required: false })
  @ApiCreatedResponse({ description: 'Created', type: Student })
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
  @ApiOperation({ summary: 'Get all students' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'fieldName', required: false })
  @ApiQuery({ name: 'fieldValue', required: false })
  @ApiQuery({ name: 'pageNumber', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiOkResponse({ description: 'Found', type: [Student] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findAll(@Users() user, @Query() query) {
    return this.studentsService.findAll(user, query);
  }

  @Get('findOne')
  @ApiOperation({ summary: 'Get one student' })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'id',
    required: true,
  })
  @ApiQuery({
    name: 'name',
    required: true,
  })
  @ApiOkResponse({ description: 'Found', type: Student })
  @ApiNotFoundResponse({ description: 'Not Found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async findOne(@Users() user, @Query() query) {
    return this.studentsService.findOne(user, query);
  }

  @Patch('update')
  @ApiOperation({ summary: 'Get one student and update' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateStudentDto })
  @ApiParam({ name: 'id', required: true })
  @ApiOkResponse({ description: 'Updated', type: Student })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Not Found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @UseInterceptors(FileInterceptor('file', StudentStorage))
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async update(
    @Query('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Users() user,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.update(id, updateStudentDto, user, file);
  }

  @Patch('update/isActive')
  @ApiOperation({ summary: 'Get one student and update the status' })
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
    @Query('id') id: string,
    @Users() user,
    @Body() body: UpdateStatusDto,
  ) {
    return this.studentsService.isActive(id, user, body);
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Get one student and soft delete' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns success message of deletion',
  })
  @UseGuards(RoleGuard([Role.School, Role.Admin]))
  async remove(@Users() user, @Query() id: string) {
    return this.studentsService.remove(user, id);
  }

  @Get('totalCount')
  @ApiOperation({ summary: 'get total count of students' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'std', description: 'to get standard wise count' })
  @ApiQuery({ name: 'school', description: 'to get school wise count' })
  @ApiResponse({
    status: 200,
    description: 'Returns total count of students',
    type: Number,
  })
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async totalCount(@Users() user, @Query() query) {
    return this.studentsService.totalCount(user, query);
  }

  @Get('totalStudentCount')
  @ApiOperation({ summary: 'get total student counts registered on the site' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns total count of students',
    type: Number,
  })
  @UseGuards(RoleGuard(Role.Admin))
  async totalStudentCount() {
    return this.studentsService.totalStudentCount();
  }

  @Get('getAllStds')
  @ApiOperation({ summary: 'Get all available standards of each school' })
  @ApiOkResponse({
    description: 'Will return a list of all the available standards!',
  })
  @ApiBearerAuth()
  @UseGuards(RoleGuard([Role.Admin, Role.School]))
  async getAllStds() {
    return this.studentsService.getAllStds();
  }
}

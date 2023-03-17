import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtHelper } from 'src/utils/utils';
import { School, SchoolSchema } from 'src/schemas/schools.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SchoolController],
  providers: [SchoolService, JwtHelper],
})
export class SchoolModule {}

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ValidateObjectId implements PipeTransform<string> {
  async transform(value: string) {
    const isValid = mongoose.Types.ObjectId.isValid(value);
    if (!isValid) throw new BadRequestException('Invalid ID!');
    return value;
  }
}

export async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}

export async function verifyPass(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

@Injectable()
export class JwtHelper {
  constructor(private jwtService: JwtService) {}

  async sign(payload: string | object | Buffer) {
    return this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: process.env.JWT_SECRET,
    });
  }
}

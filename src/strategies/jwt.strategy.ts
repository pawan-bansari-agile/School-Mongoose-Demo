import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  async validate(payload: { id: string; email: string; role: string }) {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
// import { UnauthorizedException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { PassportStrategy } from '@nestjs/passport';
// import { Request } from 'express';
// import { Model } from 'mongoose';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { User, UserDocument } from 'src/schemas/user.schema';

// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: process.env.JWT_SECRET,
//     });
//   }

//   async validate(payload: any, req: Request) {
//     if (!payload) {
//       throw new UnauthorizedException();
//     }
//     const user = await this.userModel.findOne({
//       email: payload.email,
//     });
//     if (!user) {
//       throw new UnauthorizedException();
//     }
//     req.user = user;
//     return req.user;
//   }
// }

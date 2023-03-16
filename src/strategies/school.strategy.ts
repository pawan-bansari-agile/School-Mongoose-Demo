// import { UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Request } from 'express';
// import { ExtractJwt, Strategy } from 'passport-jwt';

// export class SchoolStrategy extends PassportStrategy(Strategy, 'school') {
//   constructor() {
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
//     const user = await this.schoolRepo.findOne({
//       where: { email: payload.email },
//     });
//     if (!user) {
//       throw new UnauthorizedException();
//     }
//     req.user = user;
//     return req.user;
//   }
// }

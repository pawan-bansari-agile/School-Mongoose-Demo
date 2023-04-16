// import { ExecutionContext, Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { AuthGuard } from '@nestjs/passport';
// import { ExtractJwt } from 'passport-jwt';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
//   constructor(private jwtService: JwtService) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: process.env.JWT_SECRET,
//     });
//   }
//   async canActivate(context: ExecutionContext) {
//     const req = context.switchToHttp().getRequest();
//     console.log('request', req.rawHeaders);

//     const gettingAssignedToken = req.rawHeaders[9];
//     console.log('gettingAssignedToken from authguard', gettingAssignedToken);

//     const assignedToken = gettingAssignedToken;
//     console.log('assignedToken', assignedToken);

//     const decoded = this.jwtService.decode(assignedToken);
//     console.log('decoded', decoded);

//     req.user = decoded;
//     return true;
//   }
// }
import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    // ExtractJwt.fromAuthHeaderAsBearerToken() automatically extracts the bearer token from the request headers

    const decoded = this.jwtService.decode(token);
    // Decode the token using JwtService from @nestjs/jwt

    req.user = decoded;
    // Set the decoded user object to the request object for further use

    return true;
  }
}

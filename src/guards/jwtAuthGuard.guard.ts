import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const gettingAssignedToken = req.rawHeaders[1].split(' ');
    const assignedToken = gettingAssignedToken[1];

    const decoded = this.jwtService.decode(assignedToken);

    req.user = decoded;
    return true;
  }
}

import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { JwtAuthGuard } from './jwtAuthGuard.guard';
import Role from 'src/utils/consts';

const RoleGuard = (role: Role[] | Role): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthGuard {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (user.role === role || role.includes(user.role)) {
        return user;
      }
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;

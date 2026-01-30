import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from 'src/modules/users/entities/user.entity';

type JwtUser = {
  id: number;
  roles: string[];
  role: UserRole;
};

export interface RequestWithUser extends Request {
  user: JwtUser;
}

const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

export default CurrentUser;
export type { JwtUser };

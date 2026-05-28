import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type JwtUser = {
  id: number;
  roles: string[];
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

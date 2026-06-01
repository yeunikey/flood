import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { RequestWithUser } from '../decorators/user.decorator';

@Injectable()
export class EditorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!['admin', 'editor'].includes(request.user?.role ?? '')) {
      throw new ForbiddenException('Только для редакторов');
    }

    return true;
  }
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';

@Injectable()
export class IsCurrentUserOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as Record<string, unknown>)['user'] as AuthUser | undefined;
    const pathUserId = request.params['userId'] as string | undefined;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === UserRoles.ADMIN.toString()) {
      return true;
    }

    if (user.id === pathUserId) {
      return true;
    }

    throw new ForbiddenException('Access denied: user can only access their own data');
  }
}

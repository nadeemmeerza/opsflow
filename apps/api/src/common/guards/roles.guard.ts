import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    // Endpoint has no role restriction
    if (!requiredRoles) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const organizationRole =
      request.organizationRole;

    if (!organizationRole) {
      throw new ForbiddenException(
        'Organization role not available',
      );
    }

    if (!requiredRoles.includes(organizationRole)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
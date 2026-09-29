import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { OrganizationMembersService } from '../organization-members.service.js';



@Injectable()
export class OrganizationMembershipGuard
  implements CanActivate
{
  constructor(
    private readonly membersService: OrganizationMembersService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    const organizationId =
      request.params.organizationId;

    if (!user?.userId) {
      throw new ForbiddenException(
        'User not authenticated',
      );
    }

    if (
      !organizationId ||
      !Types.ObjectId.isValid(organizationId)
    ) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const membership =
      await this.membersService.findMembership(
        organizationId,
        user.userId,
      );

    if (!membership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    // Make the organization-specific role
    // available to later guards/controllers.
    request.organizationMembership = membership;
    request.organizationRole = membership.role;

    return true;
  }
}
import { IsIn } from 'class-validator';

/**
 * Controls which roles an existing member can be changed to.
 *
 * Owner is intentionally excluded. Ownership should not be
 * transferred through the normal member-management endpoint.
 */
export class UpdateMemberRoleDto {
  @IsIn(['admin', 'member'])
  role: 'admin' | 'member';
}
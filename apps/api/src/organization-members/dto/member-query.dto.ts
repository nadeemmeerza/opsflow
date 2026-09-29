import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/*
 * Query parameters for the organization member list.
 *
 * Keeping pagination/filtering on the API prevents the frontend
 * from loading every member just to perform a local search.
 */
export class MemberQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  /*
   * Search is applied to the populated user's name and email.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /*
   * The owner role is included here because owners can appear
   * in the member listing, even though it cannot be assigned
   * through AddMemberDto.
   */
  @IsOptional()
  @IsIn(['owner', 'admin', 'member'])
  role?: 'owner' | 'admin' | 'member';

  @IsOptional()
  @IsIn(['name', 'email', 'role', 'createdAt'])
  sortBy?: 'name' | 'email' | 'role' | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
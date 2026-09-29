import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

/**
 * Query parameters supported by the organization list.
 *
 * Search, filtering, sorting, and pagination are handled by
 * MongoDB so the API does not need to load every organization
 * into application memory.
 */
export class OrganizationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  /**
   * Searches organization name and slug.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filters organizations by status.
   */
  @IsOptional()
  @IsIn(['active', 'suspended'])
  status?: 'active' | 'suspended';

  /**
   * Controls which organization field is used for sorting.
   */
  @IsOptional()
  @IsIn([
    'name',
    'slug',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'name'
    | 'slug'
    | 'status'
    | 'createdAt'
    | 'updatedAt';

  /**
   * Controls ascending or descending ordering.
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
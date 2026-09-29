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
 * Query parameters supported by the customer list.
 *
 * Search, filtering, sorting, and pagination are handled by the API
 * so the browser does not need to download the complete customer list.
 */
export class CustomerQueryDto {
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
   * Searches the main customer fields.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filters customers by their active/inactive state.
   */
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  /**
   * Controls which field MongoDB uses for sorting.
   */
  @IsOptional()
  @IsIn([
    'name',
    'email',
    'company',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'name'
    | 'email'
    | 'company'
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
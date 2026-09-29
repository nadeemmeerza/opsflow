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
 * Query parameters supported by the ticket list.
 *
 * Search, filtering, sorting, and pagination are handled by
 * MongoDB so the API does not need to load every ticket into
 * application memory.
 */
export class TicketQueryDto {
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
   * Searches the ticket title and description.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filters tickets by workflow status.
   */
  @IsOptional()
  @IsIn([
    'open',
    'in_progress',
    'waiting',
    'resolved',
    'closed',
  ])
  status?:
    | 'open'
    | 'in_progress'
    | 'waiting'
    | 'resolved'
    | 'closed';

  /**
   * Filters tickets by priority.
   */
  @IsOptional()
  @IsIn([
    'low',
    'medium',
    'high',
    'urgent',
  ])
  priority?:
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

  /**
   * Controls which database field is used for sorting.
   */
  @IsOptional()
  @IsIn([
    'title',
    'status',
    'priority',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'title'
    | 'status'
    | 'priority'
    | 'createdAt'
    | 'updatedAt';

  /**
   * Controls ascending or descending ordering.
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
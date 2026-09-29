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
 * Query parameters used by the task list.
 *
 * The API performs search, filtering, sorting, and pagination on the
 * database side so the frontend does not need to load every task.
 */
export class TaskQueryDto {
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
   * Searches task title and description.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Filters tasks by workflow status.
   */
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  /**
   * Filters tasks by priority.
   */
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  /**
   * Controls which database field is used for ordering.
   */
  @IsOptional()
  @IsIn([
    'title',
    'status',
    'priority',
    'dueDate',
    'createdAt',
    'updatedAt',
  ])
  sortBy?:
    | 'title'
    | 'status'
    | 'priority'
    | 'dueDate'
    | 'createdAt'
    | 'updatedAt';

  /**
   * Controls ascending or descending order.
   */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
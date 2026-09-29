import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Defines the query parameters supported by the Projects list endpoint.
 *
 * Keeping these rules in a DTO means NestJS validates and transforms
 * incoming URL parameters before they reach the service layer.
 */
export class ProjectQueryDto {
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
   * Search is intentionally performed by the backend so pagination
   * operates on the filtered dataset rather than only the currently
   * loaded page.
   */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';

  /**
   * Restricting sortBy to known fields prevents arbitrary MongoDB
   * fields from being supplied through the URL.
   */
  @IsOptional()
  @IsIn(['name', 'key', 'createdAt', 'updatedAt', 'status'])
  sortBy?: 'name' | 'key' | 'createdAt' | 'updatedAt' | 'status';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}


/**
 * Validates the data required to create a new project.
 *
 * NestJS uses this DTO together with the global ValidationPipe
 * to reject invalid request bodies before they reach the service.
 */
export class CreateProjectDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 20)
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

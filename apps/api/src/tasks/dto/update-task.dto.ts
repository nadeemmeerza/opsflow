import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsIn([
    'todo',
    'in_progress',
    'review',
    'done',
  ])
  status?:
    | 'todo'
    | 'in_progress'
    | 'review'
    | 'done';

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

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
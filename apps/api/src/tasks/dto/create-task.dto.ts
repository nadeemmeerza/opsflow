import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsMongoId,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(2, 200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

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
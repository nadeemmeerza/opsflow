import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

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
}
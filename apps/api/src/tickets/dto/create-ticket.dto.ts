import {
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(3, 200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsMongoId()
  customerId: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

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
}
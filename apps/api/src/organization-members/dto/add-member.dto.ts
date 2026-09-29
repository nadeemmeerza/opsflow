import {
  IsEmail,
  IsIn,
} from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsIn(['admin', 'member'])
  role: 'admin' | 'member';
}
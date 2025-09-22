import { IsString, IsEnum, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { TaskStatus, TaskPriority } from '@turbovets/data';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['todo', 'in_progress', 'done'])
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
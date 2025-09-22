import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { TaskStatus, TaskPriority } from '@turbovets/data';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['todo', 'in_progress', 'done'])
  status: TaskStatus;

  @IsEnum(['low', 'medium', 'high'])
  priority: TaskPriority;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
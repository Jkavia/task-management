import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request, 
  Query,
  ValidationPipe 
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../auth/rbac.guard';
import { TaskQueryDto, TaskListResponse } from '@turbovets/data';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, User } from '../entities';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions({ action: 'create', resource: 'task' })
  create(
    @Body(ValidationPipe) createTaskDto: CreateTaskDto,
    @Request() req: { user: User }
  ): Promise<Task> {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  @RequirePermissions({ action: 'read', resource: 'task' })
  findAll(
    @Query() query: TaskQueryDto,
    @Request() req: { user: User }
  ): Promise<TaskListResponse> {
    return this.tasksService.findAll(req.user, query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', resource: 'task' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: User }
  ): Promise<Task> {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', resource: 'task' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
    @Request() req: { user: User }
  ): Promise<Task> {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Patch(':id/status')
  @RequirePermissions({ action: 'update', resource: 'task' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: { user: User }
  ): Promise<Task> {
    return this.tasksService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', resource: 'task' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: User }
  ): Promise<void> {
    return this.tasksService.remove(id, req.user);
  }
}
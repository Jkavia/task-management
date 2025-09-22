import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, AuditLog } from '../entities';
import { TaskQueryDto, TaskListResponse } from '@turbovets/data';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(user: User, query: TaskQueryDto): Promise<TaskListResponse> {
    this.logger.log(`Finding tasks for user ${user.email} with query: ${JSON.stringify(query)}`);
    const { status, priority, assignee, category, page = 1, limit = 50 } = query;
    
    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.company', 'company')
      .leftJoinAndSelect('task.department', 'department');

    // Apply role-based filtering
    if (user.role === 'owner') {
      queryBuilder.where('task.companyId = :companyId', { companyId: user.companyId });
    } else {
      queryBuilder.where('task.departmentId = :departmentId', { departmentId: user.departmentId });
    }

    // Apply filters
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }
    if (assignee) {
      queryBuilder.andWhere('task.assigneeId = :assignee', { assignee });
    }
    if (category) {
      queryBuilder.andWhere('task.category = :category', { category });
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by creation date
    queryBuilder.orderBy('task.createdAt', 'DESC');

    const [tasks, total] = await queryBuilder.getManyAndCount();
    this.logger.log(`Found ${tasks.length} tasks out of ${total} total for user ${user.email}`);

    await this.logAction(user.id, 'READ', 'task', 'multiple');

    return {
      tasks,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User): Promise<Task> {
    this.logger.log(`Finding task ${id} for user ${user.email}`);
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee', 'createdBy', 'company', 'department'],
    });

    if (!task) {
      this.logger.warn(`Task ${id} not found`);
      throw new NotFoundException('Task not found');
    }

    // Check access permissions
    if (!this.canAccessTask(user, task)) {
      this.logger.warn(`User ${user.email} denied access to task ${id}`);
      throw new ForbiddenException('Access denied');
    }

    await this.logAction(user.id, 'READ', 'task', id);

    return task;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    this.logger.log(`Creating task for user ${user.email}: ${JSON.stringify(createTaskDto)}`);
    const assignee = await this.userRepository.findOne({
      where: { id: createTaskDto.assigneeId },
    });

    if (!assignee) {
      this.logger.warn(`Assignee ${createTaskDto.assigneeId} not found`);
      throw new NotFoundException('Assignee not found');
    }

    if (user.role !== 'owner' && assignee.departmentId !== user.departmentId) {
      this.logger.warn(`User ${user.email} tried to assign task to user outside department`);
      throw new ForbiddenException('Cannot assign task to user outside your department');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.id,
      companyId: user.companyId,
      departmentId: assignee.departmentId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });

    const savedTask = await this.taskRepository.save(task);
    this.logger.log(`Task created successfully with ID: ${savedTask.id}`);
    
    await this.logAction(user.id, 'CREATE', 'task', savedTask.id);

    return this.findOne(savedTask.id, user);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    this.logger.log(`Updating task ${id} for user ${user.email}: ${JSON.stringify(updateTaskDto)}`);
    const task = await this.findOne(id, user);

    if (!this.canUpdateTask(user, task)) {
      this.logger.warn(`User ${user.email} cannot update task ${id}`);
      throw new ForbiddenException('Cannot update this task');
    }

    if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== task.assigneeId) {
      const newAssignee = await this.userRepository.findOne({
        where: { id: updateTaskDto.assigneeId },
      });

      if (!newAssignee) {
        throw new NotFoundException('New assignee not found');
      }

      if (user.role !== 'owner' && newAssignee.departmentId !== user.departmentId) {
        throw new ForbiddenException('Cannot assign task to user outside your department');
      }
    }

    await this.taskRepository.update(id, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
    });

    await this.logAction(user.id, 'UPDATE', 'task', id);

    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    this.logger.log(`Deleting task ${id} for user ${user.email}`);
    const task = await this.findOne(id, user);

    if (user.role === 'viewer') {
      this.logger.warn(`Viewer ${user.email} tried to delete task ${id}`);
      throw new ForbiddenException('Viewers cannot delete tasks');
    }

    await this.taskRepository.remove(task);
    this.logger.log(`Task ${id} deleted successfully`);
    await this.logAction(user.id, 'DELETE', 'task', id);
  }

  async updateStatus(id: string, status: string, user: User): Promise<Task> {
    this.logger.log(`Updating task ${id} status to ${status} for user ${user.email}`);
    return this.update(id, { status: status as any }, user);
  }

  private canAccessTask(user: User, task: Task): boolean {
    if (user.role === 'owner' && user.companyId === task.companyId) {
      return true;
    }
    
    if (user.role === 'admin' && user.departmentId === task.departmentId) {
      return true;
    }
    
    if (user.role === 'viewer' && user.departmentId === task.departmentId) {
      return true;
    }
    
    return false;
  }

  private canUpdateTask(user: User, task: Task): boolean {
    if (user.role === 'owner' && user.companyId === task.companyId) {
      return true;
    }
    
    if (user.role === 'admin' && user.departmentId === task.departmentId) {
      return true;
    }
    
    if (user.role === 'viewer' && (task.assigneeId === user.id || task.createdById === user.id)) {
      return true;
    }
    
    return false;
  }

  private async logAction(userId: string, action: string, resource: string, resourceId: string): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
    });

    await this.auditLogRepository.save(auditLog);
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, User, AuditLog } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, AuditLog])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
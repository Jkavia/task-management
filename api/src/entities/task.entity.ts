import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { Department } from './department.entity';
import { User } from './user.entity';
import { TaskStatus, TaskPriority } from '@turbovets/data';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status: TaskStatus;

  @Column({
    type: 'varchar',
    length: 10,
  })
  priority: TaskPriority;

  @Column()
  category: string;

  @Column()
  assigneeId: string;

  @Column()
  createdById: string;

  @Column()
  companyId: string;

  @Column()
  departmentId: string;

  @Column({ nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Company, company => company.tasks)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Department, department => department.tasks)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @ManyToOne(() => User, user => user.assignedTasks)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
}
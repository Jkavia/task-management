import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { Department } from './department.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';
import { UserRole } from '@turbovets/data';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  companyId: string;

  @Column()
  departmentId: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, company => company.users)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Department, department => department.users)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => AuditLog, auditLog => auditLog.user)
  auditLogs: AuditLog[];
}
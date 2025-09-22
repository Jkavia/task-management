import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Company, company => company.departments)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => User, user => user.department)
  users: User[];

  @OneToMany(() => Task, task => task.department)
  tasks: Task[];
}
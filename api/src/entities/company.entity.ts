import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Department, department => department.company)
  departments: Department[];

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Task, task => task.company)
  tasks: Task[];
}
// Core Entity Interfaces for Task Management System

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyId: string;
  departmentId: string;
  role: UserRole;
  createdAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeId: string;
  createdById: string;
  companyId: string;
  departmentId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
}

// DTOs for API requests/responses

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  departmentName: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assigneeId: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface TaskQueryDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// Response interfaces

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
}

export interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// JWT Payload interface
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  companyId: string;
  departmentId: string;
  iat: number;
  exp: number;
}

// Permission checking types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionResource = 'task' | 'user' | 'company' | 'department' | 'audit_log';
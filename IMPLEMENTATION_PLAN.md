# 8-Hour Task Management System - Streamlined Implementation Plan

## Time-Boxed Development Plan (8 Hours Total)

### Hour 1: Setup & Foundation
- **30min**: Create NX monorepo with basic structure
- **30min**: Set up shared data interfaces library

### Hours 2-3: Backend Core (2 hours)
- **45min**: NestJS app with TypeORM entities (simplified schema)
- **45min**: JWT authentication (login/register only)
- **30min**: Basic RBAC guards and decorators

### Hours 4-5: Backend APIs (2 hours)
- **60min**: Task CRUD endpoints with permission checks
- **30min**: User/org endpoints (minimal)
- **30min**: Basic audit logging (console output)

### Hours 6-7: Frontend Core (2 hours)
- **45min**: Angular app with TailwindCSS and auth UI
- **45min**: Task dashboard with basic CRUD
- **30min**: Simple drag-and-drop (status change only)

### Hour 8: Polish & Documentation
- **30min**: Basic tests (key RBAC logic only)
- **30min**: README with setup instructions

## Simplified Data Model (MVP)

### Core Entities (Minimal Viable Schema)
```typescript
// Company
interface Company {
  id: string;
  name: string;
  createdAt: Date;
}

// Department  
interface Department {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
}

// User
interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyId: string;
  departmentId: string;
  role: 'owner' | 'admin' | 'viewer'; // Simplified - single role per user
  createdAt: Date;
}

// Task
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string; // Simple string, not normalized
  assigneeId: string;
  createdById: string;
  companyId: string;
  departmentId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// AuditLog (Simple)
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
}
```

## Simplified RBAC Rules

### Role Permissions (Hardcoded for Speed)
- **Owner**: Full access to company data
- **Admin**: Full access to department data  
- **Viewer**: Read tasks, edit own tasks only

### Access Logic (Simple)
```typescript
function canAccessTask(user: User, task: Task, action: string): boolean {
  if (user.role === 'owner' && user.companyId === task.companyId) return true;
  if (user.role === 'admin' && user.departmentId === task.departmentId) return true;
  if (user.role === 'viewer' && action === 'read' && user.departmentId === task.departmentId) return true;
  if (user.role === 'viewer' && action !== 'delete' && task.assigneeId === user.id) return true;
  return false;
}
```

## Essential API Endpoints (MVP)

### Auth
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register company owner

### Tasks  
- `GET /tasks` - List accessible tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `PATCH /tasks/:id/status` - Change status (for drag-drop)

### Basic Data
- `GET /users/me` - Current user profile
- `GET /departments/:id/users` - Department users (for task assignment)

## Frontend MVP Features

### Core Components
1. **Login Form** - Simple email/password
2. **Task Board** - 3 columns (Todo, In Progress, Done)
3. **Task Card** - Title, assignee, priority badge
4. **Task Form** - Create/edit modal
5. **Simple Filters** - By assignee, priority

### Drag & Drop
- Use Angular CDK drag-drop
- Only allow status changes (column to column)
- No complex reordering within columns

### Responsive Design
- Mobile-first with TailwindCSS
- Stack columns vertically on mobile
- Simple, clean UI

## Technology Stack (Simplified)

### Backend
- NestJS with basic structure
- TypeORM with SQLite (file-based)
- JWT with simple secret
- bcrypt for passwords
- Basic validation pipes

### Frontend  
- Angular 17 (standalone components)
- TailwindCSS for styling
- Angular CDK for drag-drop
- RxJS for basic state (no complex state management)
- Angular Reactive Forms

### Testing (Minimal)
- Jest for key RBAC functions
- Basic component tests for auth
- No E2E tests (time constraint)

## Development Shortcuts for 8-Hour Constraint

1. **Use Angular CLI schematics** for quick component generation
2. **Hardcode initial data** (roles, statuses, priorities) instead of admin UI
3. **Simple file-based SQLite** - no complex DB setup
4. **Basic error handling** - focus on happy path
5. **Minimal validation** - client-side only for speed
6. **Console logging** instead of proper audit system
7. **Single environment** - no dev/prod configs
8. **Basic responsive** - mobile stacked, desktop columns

## File Structure (Streamlined)
```
turbovets/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── users/
│   │   │   └── main.ts
│   │   └── database.sqlite
│   └── dashboard/
│       └── src/
│           ├── app/
│           │   ├── auth/
│           │   ├── tasks/
│           │   └── shared/
│           └── styles.css
├── libs/
│   └── data/
│       └── src/
│           └── interfaces/
└── README.md
```

## Success Criteria (8-Hour MVP)

✅ **Must Have**
- JWT authentication working
- RBAC preventing unauthorized access
- Task CRUD with proper permissions
- Drag-drop status changes
- Mobile responsive
- Basic audit logging
- Setup instructions in README

✅ **Nice to Have (if time permits)**
- Task filtering
- User assignment dropdown
- Priority/category badges
- Basic tests

This plan focuses on delivering a working, secure system that meets all core requirements within the 8-hour constraint while maintaining code quality and proper architecture.
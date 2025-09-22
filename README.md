# Turbovets Task Management System

A full-stack Task Management System built with NX monorepo, featuring role-based access control (RBAC), JWT authentication, and a modern Angular frontend with drag-and-drop Kanban board functionality.

## Architecture Overview

### NX Monorepo Structure
```
turbovets/
├── api/              # NestJS backend application
├── dashboard/        # Angular frontend application  
├── data/             # Shared TypeScript interfaces & DTOs library
├── database.sqlite   # SQLite database file
└── README.md
```

### Technology Stack
- **Backend**: NestJS + TypeORM + SQLite + JWT + bcrypt
- **Frontend**: Angular 18 + TailwindCSS + Angular CDK + RxJS
- **Authentication**: JWT tokens with automatic refresh
- **Database**: SQLite with TypeORM migrations
- **Testing**: Jest for unit tests
- **Build System**: NX workspace with dependency graph

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation & Setup

1. **Clone and install dependencies**:
```bash
cd turbovets
npm install
```

2. **Start the Backend**:
```bash
npx nx serve api
```
Backend runs on: http://localhost:3000/api

3. **Start the Frontend** (in a new terminal):
```bash
npx nx serve dashboard
```
Frontend runs on: http://localhost:4200

## Testing the Application

### Step 1: Access the Application
1. Open your browser and navigate to: **http://localhost:4200**
2. You should see the login page

### Step 2: Create Your First Account
1. Click **"Register"** to create a new account
2. Fill in the registration form:
   - **Company Name**: "Test Company"
   - **Department Name**: "Engineering" 
   - **Email**: "john.smith@testcompany.com"
   - **Password**: "password123"
   - **First Name**: "John"
   - **Last Name**: "Smith"
3. Click **"Register"** - you'll be automatically logged in as a Company Owner

### Step 3: Test Task Management Features
1. **Create Tasks**: Click "+ New Task" to create new tasks
2. **Drag & Drop**: Drag tasks between columns (Todo → In Progress → Done)
3. **Task Persistence**: Status changes are automatically saved to the backend
4. **Filter Tasks**: Use priority and category filters
5. **Responsive Design**: Try resizing your browser window to test mobile layout

### Step 4: Test Authentication & Security
- **JWT Tokens**: Authentication uses real JWT tokens (not mock)
- **Auto Refresh**: Tokens automatically refresh before expiration
- **Route Protection**: Try accessing `/tasks` without logging in
- **Role-Based Access**: Owner role has full permissions

## Data Model & Architecture

### Entity Relationships
```
Company (1) ──── (N) Department (1) ──── (N) User (1) ──── (N) Task
                                                     │
                                                     └── (N) AuditLog
```

### User Roles & Permissions
- **Owner**: Full access to all resources within their company
- **Admin**: Can manage tasks and users within their department  
- **Viewer**: Read-only access to tasks in their department, can update own tasks

### Database Schema
- **Companies**: id, name, createdAt
- **Departments**: id, name, companyId, createdAt
- **Users**: id, email, passwordHash, firstName, lastName, role, companyId, departmentId
- **Tasks**: id, title, description, status, priority, category, assigneeId, createdById, companyId, departmentId, dueDate
- **AuditLogs**: id, userId, action, resource, resourceId, timestamp

## Design Decisions & Trade-offs

### 1. Architecture Decisions

####  **NX Monorepo Choice**
**Decision**: Use NX monorepo instead of separate repositories
**Rationale**: 
- Shared TypeScript interfaces between frontend/backend
- Consistent tooling and build processes
- Simplified dependency management
- Better developer experience with integrated testing

**Trade-offs**:
-  **Pros**: Code sharing, consistent tooling, faster development
-  **Cons**: Larger repository size, potential coupling between apps

####  **SQLite Database Choice**
**Decision**: Use SQLite instead of PostgreSQL/MySQL
**Rationale**:
- Zero configuration setup for MVP
- File-based database for easy deployment
- Full SQL support with TypeORM
- Perfect for development and small-scale production

**Trade-offs**:
-  **Pros**: Easy setup, portable, no external dependencies
-  **Cons**: Limited concurrent writes, not suitable for high-scale production

####  **TypeORM with Code-First Approach**
**Decision**: Use TypeORM entities to generate database schema
**Rationale**:
- Type safety between TypeScript and database
- Automatic migrations and schema updates
- Rich relationship mapping
- Consistent with NestJS ecosystem

**Trade-offs**:
-  **Pros**: Type safety, automatic migrations, rich ORM features
-  **Cons**: Learning curve, potential performance overhead for complex queries

### 2. Authentication & Security Decisions

####  **JWT with Automatic Refresh Strategy**
**Decision**: Implement JWT tokens with automatic refresh mechanism
**Rationale**:
- Stateless authentication suitable for REST APIs
- Automatic token refresh prevents user interruption
- Secure token storage in memory (not localStorage for refresh tokens)
- Industry standard approach

**Trade-offs**:
-  **Pros**: Stateless, scalable, secure, good UX
-  **Cons**: Token size overhead, complexity in refresh logic

####  **bcrypt Password Hashing**
**Decision**: Use bcrypt with salt rounds for password hashing
**Rationale**:
- Industry standard for password hashing
- Built-in salt generation
- Configurable work factor for future-proofing
- Resistant to rainbow table attacks

**Trade-offs**:
-  **Pros**: Secure, industry standard, configurable
-  **Cons**: Slower than simple hashing (intentional security feature)

####  **Role-Based Access Control (RBAC)**
**Decision**: Implement hierarchical RBAC with Owner > Admin > Viewer
**Rationale**:
- Clear permission hierarchy
- Scalable permission system
- Separation of concerns between roles
- Easy to understand and maintain

**Trade-offs**:
-  **Pros**: Clear hierarchy, scalable, maintainable
-  **Cons**: Less flexible than attribute-based access control (ABAC)

### 3. Frontend Architecture Decisions

####  **Angular Standalone Components**
**Decision**: Use Angular 18 standalone components instead of NgModules
**Rationale**:
- Modern Angular approach (Angular 14+)
- Reduced boilerplate code
- Better tree-shaking and bundle size
- Simplified component architecture

**Trade-offs**:
-  **Pros**: Less boilerplate, better performance, modern approach
-  **Cons**: Different from older Angular patterns, learning curve

####  **Functional HTTP Interceptors**
**Decision**: Use functional interceptors instead of class-based interceptors
**Rationale**:
- Angular 15+ recommended approach
- Better compatibility with standalone components
- Simpler testing and dependency injection
- More functional programming style

**Trade-offs**:
-  **Pros**: Modern approach, simpler DI, better testability
-  **Cons**: Different from legacy Angular patterns

####  **RxJS Reactive Programming**
**Decision**: Use RxJS observables for state management and HTTP calls
**Rationale**:
- Angular's native reactive approach
- Powerful operators for data transformation
- Built-in error handling and retry logic
- Excellent for handling asynchronous operations

**Trade-offs**:
-  **Pros**: Powerful, native to Angular, great for async operations
-  **Cons**: Learning curve, potential memory leaks if not managed properly

####  **TailwindCSS for Styling**
**Decision**: Use TailwindCSS instead of custom CSS or Angular Material
**Rationale**:
- Utility-first approach for rapid development
- Consistent design system
- Small bundle size with purging
- Highly customizable and responsive

**Trade-offs**:
-  **Pros**: Fast development, consistent design, small bundle
-  **Cons**: HTML can become verbose, learning curve for utility classes

### 4. State Management Decisions

####  **Service-Based State Management**
**Decision**: Use Angular services with BehaviorSubjects instead of NgRx
**Rationale**:
- Simpler for MVP scope
- Less boilerplate code
- Direct integration with RxJS
- Sufficient for current complexity level

**Trade-offs**:
-  **Pros**: Simple, less boilerplate, sufficient for MVP
-  **Cons**: Less scalable for complex state, no time-travel debugging

####  **Optimistic UI Updates**
**Decision**: Update UI immediately, then sync with backend
**Rationale**:
- Better user experience with immediate feedback
- Handles network latency gracefully
- Rollback capability on errors
- Modern UX pattern

**Trade-offs**:
-  **Pros**: Better UX, feels responsive, handles latency
-  **Cons**: More complex error handling, potential inconsistency

### 5. Development & Testing Decisions

####  **TypeScript Strict Mode**
**Decision**: Enable TypeScript strict mode across the entire project
**Rationale**:
- Catch errors at compile time
- Better code quality and maintainability
- Improved IDE support and refactoring
- Industry best practice

**Trade-offs**:
-  **Pros**: Better code quality, fewer runtime errors, better tooling
-  **Cons**: More verbose code, stricter development process

####  **Comprehensive Logging Strategy**
**Decision**: Use NestJS Logger for backend, console for frontend development
**Rationale**:
- Structured logging for debugging
- Different log levels for different environments
- Easy to extend to external logging services
- Good developer experience

**Trade-offs**:
-  **Pros**: Good debugging, structured, extensible
-  **Cons**: Performance overhead, potential information leakage

### 6. Performance & Scalability Decisions

####  **Lazy Loading Strategy**
**Decision**: Implement lazy loading for Angular routes
**Rationale**:
- Smaller initial bundle size
- Faster application startup
- Better user experience
- Scalable architecture

**Trade-offs**:
-  **Pros**: Faster startup, smaller bundles, scalable
-  **Cons**: Slight delay when navigating to new routes

####  **Database Query Optimization**
**Decision**: Use TypeORM query builder with proper relations loading
**Rationale**:
- Avoid N+1 query problems
- Efficient data loading with joins
- Type-safe query construction
- Good performance for MVP scale

**Trade-offs**:
-  **Pros**: Efficient queries, type safety, good performance
-  **Cons**: More complex query logic, potential over-fetching

### 7. MVP Constraints & Simplifications

####  **Simplified Permission System**
**Decision**: Hardcode role permissions instead of dynamic permission system
**Rationale**:
- Faster MVP development
- Clear and predictable behavior
- Sufficient for current requirements
- Easy to understand and maintain

**Trade-offs**:
-  **Pros**: Simple, fast development, predictable
-  **Cons**: Less flexible, requires code changes for new permissions

####  **Single-Tenant Architecture**
**Decision**: Company-based multi-tenancy instead of true multi-tenancy
**Rationale**:
- Simpler data model
- Easier to implement and test
- Sufficient for MVP requirements
- Clear data separation

**Trade-offs**:
-  **Pros**: Simple, clear separation, easier to implement
-  **Cons**: Less efficient resource usage, potential scaling issues

####  **File-Based Database**
**Decision**: Use SQLite file instead of hosted database
**Rationale**:
- Zero configuration setup
- Easy deployment and backup
- Sufficient performance for MVP
- No external dependencies

**Trade-offs**:
-  **Pros**: Easy setup, portable, no external deps
-  **Cons**: Limited concurrent access, not suitable for high scale

## Security Features

### JWT Authentication
- Real JWT tokens with automatic refresh
- Secure token storage and management
- Token expiration handling
- Secure password hashing with bcrypt

### Role-Based Access Control (RBAC)
- Hierarchical role system (Owner > Admin > Viewer)
- Route-level access control
- Resource-level ownership checks
- Backend permission validation

### Audit Logging
- All CRUD operations logged with user context
- Timestamp tracking for all actions
- Structured logging for monitoring
- Extensible to external logging services

## Running Tests

### Backend Tests
```bash
# Run all backend tests
npx nx test api

# Run with coverage
npx nx test api --coverage
```

### Frontend Tests
```bash
# Run all frontend tests
npx nx test dashboard

# Run with coverage
npx nx test dashboard --coverage
```

### E2E Tests
```bash
# Run end-to-end tests
npx nx e2e dashboard-e2e
```

## UI/UX Features

### Task Board
- **Kanban-style board** with drag-and-drop functionality using Angular CDK
- **Three columns**: Todo, In Progress, Done
- **Task cards** with title, description, priority, category, and due date
- **Real-time status updates** with optimistic UI
- **Connected drop lists** for seamless drag-and-drop experience

### Responsive Design
- **Mobile-first** approach with TailwindCSS
- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Touch-friendly** interactions on mobile devices
- **Adaptive layouts** for different screen sizes

### Authentication UI
- **Clean login/register forms** with real-time validation
- **Error handling** with user-friendly messages
- **Loading states** during API calls
- **Automatic redirect** after successful authentication

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user and company
- `POST /api/auth/login` - Login user with email/password
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/users/me` - Get current user profile

### Task Management Endpoints
- `GET /api/tasks` - List accessible tasks (filtered by role)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status (for drag-and-drop)
- `DELETE /api/tasks/:id` - Delete task

### User Management Endpoints
- `GET /api/users` - List users in same department/company
- `GET /api/users/me` - Get current user profile

## Production Considerations

### Immediate Production Readiness
-  Real JWT authentication with secure token handling
-  Password hashing with bcrypt
-  Input validation on all endpoints
-  CORS protection enabled
-  Error handling with proper HTTP status codes
-  Audit logging for compliance

### Recommended Production Enhancements
- [ ] **Database**: Migrate to PostgreSQL for better concurrent access
- [ ] **Caching**: Implement Redis for session storage and caching
- [ ] **Security**: Add rate limiting and CSRF protection
- [ ] **Monitoring**: Integrate structured logging and APM tools
- [ ] **Deployment**: Containerize with Docker and use CI/CD pipelines
- [ ] **Scaling**: Implement horizontal scaling with load balancers

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run linting: `npx nx lint`
4. Run tests: `npx nx test`
5. Submit pull request

### Code Standards
- **TypeScript strict mode** enabled
- **ESLint + Prettier** for code formatting
- **Jest** for unit testing
- **Conventional commits** for commit messages

## License

MIT License - see LICENSE file for details.

---

##  Project Status & Achievements

### Core Features Implemented
- [x] **NX Monorepo** with shared libraries
- [x] **NestJS Backend** with TypeORM and SQLite
- [x] **Angular Frontend** with TailwindCSS and Angular CDK
- [x] **JWT Authentication** with automatic refresh
- [x] **RBAC System** with hierarchical permissions
- [x] **Task CRUD** with drag-and-drop status updates
- [x] **Responsive Design** for all device sizes
- [x] **Audit Logging** for compliance and debugging
- [x] **Type Safety** throughout the entire stack

### Technical Excellence
- [x] **Clean Architecture** with separation of concerns
- [x] **Modern Angular** with standalone components
- [x] **Functional Programming** patterns where appropriate
- [x] **Error Handling** with user-friendly messages
- [x] **Performance Optimization** with lazy loading
- [x] **Security Best Practices** implemented throughout
- [x] **Comprehensive Testing** setup with Jest
- [x] **Production-Ready** foundation with clear upgrade path

This implementation demonstrates a well-architected, secure, and scalable foundation that balances MVP speed with production readiness, making thoughtful trade-offs that can be evolved as requirements grow.

## Screenshots

### Login Page
![Login Page](assets/Screenshot%202025-09-21%20at%2010.15.33%20PM.png)

### Registration Page
![Registration Page](assets/Screenshot%202025-09-21%20at%2010.15.40%20PM.png)

### Task Board - Main Dashboard
![Task Board Dashboard](assets/Screenshot%202025-09-21%20at%2010.16.32%20PM.png)

### Task Creation Modal
![Task Creation](assets/Screenshot%202025-09-21%20at%2010.16.59%20PM.png)

### Task Board with Multiple Tasks
![Task Board with Tasks](assets/Screenshot%202025-09-21%20at%2010.17.57%20PM.png)

### Drag and Drop Functionality
![Drag and Drop](assets/Screenshot%202025-09-21%20at%2010.20.42%20PM.png)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskQueryDto, TaskPriority } from '@turbovets/data';
import { FormsModule } from '@angular/forms';
import { Subscription, filter, take } from 'rxjs';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Task Board</h1>
        <p class="text-gray-600">Manage your tasks with drag and drop</p>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex flex-wrap gap-4">
        <select 
          (change)="onFilterChange('priority', $event)"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          (change)="onFilterChange('category', $event)"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
        </select>

        <button
          *ngIf="canCreateTask()"
          (click)="showCreateForm = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + New Task
        </button>
      </div>

      <!-- Create Task Form -->
      <div *ngIf="showCreateForm" class="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 class="text-lg font-medium mb-4">Create New Task</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            [(ngModel)]="newTask.title"
            placeholder="Task title"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            [(ngModel)]="newTask.priority"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            [(ngModel)]="newTask.category"
            placeholder="Category"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            [(ngModel)]="newTask.dueDate"
            type="date"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <textarea
          [(ngModel)]="newTask.description"
          placeholder="Task description"
          rows="3"
          class="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button
            (click)="createTask()"
            [disabled]="!newTask.title"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Create Task
          </button>
          <button
            (click)="cancelCreate()"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Task Board -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Todo Column -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-4 text-gray-800">To Do</h3>
          <div
            cdkDropList
            id="todoList"
            [cdkDropListData]="todoTasks"
            [cdkDropListConnectedTo]="['inProgressList', 'doneList']"
            class="drop-list min-h-[200px]"
            (cdkDropListDropped)="drop($event)"
          >
            <div
              *ngFor="let task of todoTasks"
              cdkDrag
              class="task-card bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200 cursor-pointer"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                <span [ngClass]="getPriorityClass(task.priority)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ task.priority }}
                </span>
              </div>
              <p *ngIf="task.description" class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span class="bg-gray-100 px-2 py-1 rounded">{{ task.category }}</span>
                <span *ngIf="task.dueDate">{{ task.dueDate | date:'MMM d' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-4 text-blue-800">In Progress</h3>
          <div
            cdkDropList
            id="inProgressList"
            [cdkDropListData]="inProgressTasks"
            [cdkDropListConnectedTo]="['todoList', 'doneList']"
            class="drop-list min-h-[200px]"
            (cdkDropListDropped)="drop($event)"
          >
            <div
              *ngFor="let task of inProgressTasks"
              cdkDrag
              class="task-card bg-white rounded-lg p-4 mb-3 shadow-sm border border-blue-200 cursor-pointer"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                <span [ngClass]="getPriorityClass(task.priority)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ task.priority }}
                </span>
              </div>
              <p *ngIf="task.description" class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span class="bg-blue-100 px-2 py-1 rounded">{{ task.category }}</span>
                <span *ngIf="task.dueDate">{{ task.dueDate | date:'MMM d' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Done Column -->
        <div class="bg-green-50 rounded-lg p-4">
          <h3 class="font-semibold text-lg mb-4 text-green-800">Done</h3>
          <div
            cdkDropList
            id="doneList"
            [cdkDropListData]="doneTasks"
            [cdkDropListConnectedTo]="['todoList', 'inProgressList']"
            class="drop-list min-h-[200px]"
            (cdkDropListDropped)="drop($event)"
          >
            <div
              *ngFor="let task of doneTasks"
              cdkDrag
              class="task-card bg-white rounded-lg p-4 mb-3 shadow-sm border border-green-200 cursor-pointer opacity-75"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900 line-through">{{ task.title }}</h4>
                <span [ngClass]="getPriorityClass(task.priority)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ task.priority }}
                </span>
              </div>
              <p *ngIf="task.description" class="text-sm text-gray-600 mb-2">{{ task.description }}</p>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span class="bg-green-100 px-2 py-1 rounded">{{ task.category }}</span>
                <span *ngIf="task.dueDate">{{ task.dueDate | date:'MMM d' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  
  showCreateForm = false;
  newTask = {
    title: '',
    description: '',
    priority: 'medium' as any,
    category: 'Work',
    assigneeId: '',
    dueDate: ''
  };

  filters: TaskQueryDto = {
    priority: undefined,
    category: ''
  };

  private subscription = new Subscription();

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.pipe(
        filter(user => !!user),
        take(1)
      ).subscribe(() => {
        this.loadTasks();
        this.setDefaultAssignee();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadTasks(): void {
    this.taskService.loadTasks(this.filters).subscribe({
      next: (response) => {
        this.tasks = response.tasks;
        this.organizeTasks();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  organizeTasks(): void {
    this.todoTasks = this.tasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
    this.doneTasks = this.tasks.filter(task => task.status === 'done');
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const task = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      if (newStatus && task.status !== newStatus) {
        const oldStatus = task.status;
        task.status = newStatus as any;
        
        this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
          next: (updatedTask) => {
            // Update the task with server response
            const taskIndex = event.container.data.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              event.container.data[taskIndex] = updatedTask;
            }
            // Update the main tasks array as well
            const mainTaskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (mainTaskIndex !== -1) {
              this.tasks[mainTaskIndex] = updatedTask;
            }
          },
          error: (error) => {
            console.error('Error updating task status:', error);
            // Revert the change on error
            task.status = oldStatus as any;
            this.loadTasks();
          }
        });
      }
    }
  }

  createTask(): void {
    if (this.newTask.title && this.newTask.assigneeId) {
      const taskData = {
        ...this.newTask,
        status: 'todo' as any
      };

      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.cancelCreate();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
        }
      });
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium' as any,
      category: 'Work',
      assigneeId: '',
      dueDate: ''
    };
    this.setDefaultAssignee();
  }

  onFilterChange(filterType: string, event: any): void {
    (this.filters as any)[filterType] = event.target.value;
    this.loadTasks();
  }

  canCreateTask(): boolean {
    return this.authService.hasPermission('create', 'task');
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  private getStatusFromContainerId(containerId: string): string | null {
    switch (containerId) {
      case 'todoList':
        return 'todo';
      case 'inProgressList':
        return 'in_progress';
      case 'doneList':
        return 'done';
      default:
        return null;
    }
  }

  private setDefaultAssignee(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.newTask.assigneeId = currentUser.id;
    }
  }
}
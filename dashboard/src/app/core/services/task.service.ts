import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Task, CreateTaskDto, UpdateTaskDto, TaskQueryDto, TaskListResponse } from '@turbovets/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = environment.apiUrl;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public tasks$ = this.tasksSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTasks(filters?: TaskQueryDto): Observable<TaskListResponse> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<TaskListResponse>(`${this.API_URL}/tasks`, { params })
      .pipe(
        tap(response => {
          this.tasksSubject.next(response.tasks);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Error loading tasks:', error);
          let errorMessage = 'Failed to load tasks';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to view these tasks.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(`${this.API_URL}/tasks`, task)
      .pipe(
        tap(newTask => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([newTask, ...currentTasks]);
        }),
        catchError(error => {
          console.error('Error creating task:', error);
          let errorMessage = 'Failed to create task';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to create tasks.';
          } else if (error.status === 400) {
            errorMessage = 'Invalid task data. Please check your input.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  updateTask(id: string, updates: UpdateTaskDto): Observable<Task> {
    return this.http.patch<Task>(`${this.API_URL}/tasks/${id}`, updates)
      .pipe(
        tap(updatedTask => {
          const currentTasks = this.tasksSubject.value;
          const index = currentTasks.findIndex(t => t.id === id);
          if (index !== -1) {
            currentTasks[index] = updatedTask;
            this.tasksSubject.next([...currentTasks]);
          }
        }),
        catchError(error => {
          console.error('Error updating task:', error);
          let errorMessage = 'Failed to update task';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to update this task.';
          } else if (error.status === 404) {
            errorMessage = 'Task not found.';
          } else if (error.status === 400) {
            errorMessage = 'Invalid task data. Please check your input.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  updateTaskStatus(id: string, status: string): Observable<Task> {
    return this.http.patch<Task>(`${this.API_URL}/tasks/${id}/status`, { status })
      .pipe(
        tap(updatedTask => {
          const currentTasks = this.tasksSubject.value;
          const index = currentTasks.findIndex(t => t.id === id);
          if (index !== -1) {
            currentTasks[index] = { ...currentTasks[index], status: status as any };
            this.tasksSubject.next([...currentTasks]);
          }
        }),
        catchError(error => {
          console.error('Error updating task status:', error);
          let errorMessage = 'Failed to update task status';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to update this task.';
          } else if (error.status === 404) {
            errorMessage = 'Task not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/tasks/${id}`)
      .pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          const filteredTasks = currentTasks.filter(t => t.id !== id);
          this.tasksSubject.next(filteredTasks);
        }),
        catchError(error => {
          console.error('Error deleting task:', error);
          let errorMessage = 'Failed to delete task';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to delete this task.';
          } else if (error.status === 404) {
            errorMessage = 'Task not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasksSubject.value.filter(task => task.status === status);
  }

  // Optimistic update for drag and drop
  moveTask(taskId: string, newStatus: string): void {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      const updatedTasks = [...currentTasks];
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus as any };
      this.tasksSubject.next(updatedTasks);
    }
  }
}
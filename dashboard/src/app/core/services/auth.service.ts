import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { LoginDto, RegisterDto, LoginResponse, UserProfile } from '@turbovets/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('access_token')
  );
  private refreshTokenTimeout: any;

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('access_token');
    if (token && !this.currentUserSubject.value) {
      this.loadUserFromToken();
    }
  }

  login(credentials: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.currentUserSubject.next(response.user);
          this.startRefreshTokenTimer();
        }),
        catchError(error => {
          console.error('Login error:', error);
          let errorMessage = 'Login failed';
          if (error.status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  register(registerData: RegisterDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, registerData)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.currentUserSubject.next(response.user);
          this.startRefreshTokenTimer();
        }),
        catchError(error => {
          console.error('Registration error:', error);
          let errorMessage = 'Registration failed';
          if (error.status === 409) {
            errorMessage = 'User already exists with this email';
          } else if (error.status === 400) {
            errorMessage = 'Invalid registration data';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.stopRefreshTokenTimer();
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/users/me`)
      .pipe(
        tap(user => this.currentUserSubject.next(user)),
        catchError(error => {
          console.error('Profile fetch error:', error);
          if (error.status === 401) {
            this.logout();
          }
          let errorMessage = 'Failed to load profile';
          if (error.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  hasPermission(action: string, resource: string, scope?: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    switch (user.role) {
      case 'owner':
        // Owner has full access except deleting users (safety)
        if (resource === 'user' && action === 'delete') return false;
        return true;
      case 'admin':
        switch (resource) {
          case 'task':
            return true; // Admin can manage all tasks in their department
          case 'user':
            if (action === 'delete') return false; // Admin cannot delete users
            return ['read', 'update'].includes(action);
          case 'audit_log':
            return action === 'read';
          case 'department':
            return action === 'read';
          case 'company':
            return action === 'read';
          default:
            return false;
        }
      case 'viewer':
        switch (resource) {
          case 'task':
            if (action === 'read') return true; // Can read all department tasks
            if (action === 'delete') return false; // Cannot delete any tasks
            if (action === 'create') return true; // Can create tasks for themselves
            if (action === 'update') {
              // Can update own tasks (scope would need to be checked in component)
              return scope === 'own' || true; // Allow for now, backend will enforce
            }
            return false;
          case 'user':
            return action === 'read' && scope === 'own'; // Can only read their own profile
          default:
            return false;
        }
      default:
        return false;
    }
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      if (this.isTokenExpired(token)) {
        this.logout();
        return;
      }
      
      if (!this.currentUserSubject.value) {
        // Try to get user profile to validate token
        this.getProfile().subscribe({
          next: () => {
            this.startRefreshTokenTimer();
          },
          error: () => {
            // Token is invalid, clear it
            this.logout();
          }
        });
      } else {
        // We already have user data, just start the refresh timer
        this.startRefreshTokenTimer();
      }
    }
  }

  private startRefreshTokenTimer(): void {
    const token = this.getToken();
    if (!token) return;

    const jwtToken = JSON.parse(atob(token.split('.')[1]));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);

    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().subscribe();
    }, timeout);
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/refresh`, {})
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.currentUserSubject.next(response.user);
          this.startRefreshTokenTimer();
        }),
        catchError(error => {
          console.error('Token refresh error:', error);
          this.logout();
          let errorMessage = 'Session expired. Please login again.';
          if (error.status === 401) {
            errorMessage = 'Authentication failed. Please login again.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const jwtToken = JSON.parse(atob(token.split('.')[1]));
      const expires = new Date(jwtToken.exp * 1000);
      return Date.now() >= expires.getTime();
    } catch {
      return true;
    }
  }
}
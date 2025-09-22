import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuditLog } from '@turbovets/data';
import { environment } from '../../../environments/environment';

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAuditLogs(page: number = 1, limit: number = 50): Observable<AuditLogResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<AuditLogResponse>(`${this.API_URL}/audit-logs`, { params })
      .pipe(
        catchError(error => {
          console.error('Error loading audit logs:', error);
          let errorMessage = 'Failed to load audit logs';
          if (error.status === 401) {
            errorMessage = 'Authentication required. Please login again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied. You do not have permission to view audit logs.';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          return throwError(() => ({ ...error, userMessage: errorMessage }));
        })
      );
  }
}
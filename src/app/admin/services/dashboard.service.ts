// dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse, DashboardFilters, TestDetailedStats, UserDetailedStats } from '../models/admin-dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin';

  // Obtener dashboard completo con filtros
  getDashboard(filters?: DashboardFilters): Observable<DashboardResponse> {
    let params = new HttpParams();
    
    if (filters?.months_back) {
      params = params.set('months_back', filters.months_back.toString());
    }
    
    if (filters?.year) {
      params = params.set('year', filters.year.toString());
    }
    
    if (filters?.use_total) {
      params = params.set('use_total', filters.use_total.toString());
    }
    
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`, { params });
  }

  // Obtener estadísticas detalladas de un test
  getTestStats(testId: number): Observable<TestDetailedStats> {
    return this.http.get<TestDetailedStats>(`${this.apiUrl}/dashboard/tests/${testId}/stats`);
  }

  // Obtener estadísticas detalladas de un usuario
  getUserStats(userId: number): Observable<UserDetailedStats> {
    return this.http.get<UserDetailedStats>(`${this.apiUrl}/dashboard/users/${userId}/stats`);
  }

  // Obtener años disponibles para filtrado
  getAvailableYears(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/dashboard/years`);
  }
}
// dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardFilters, DashboardStats, SimpleDashboardStats } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin/dashboard';

  // Obtener estadísticas completas del dashboard
  getDashboardStats(filters?: DashboardFilters): Observable<DashboardStats> {
    let params = new HttpParams();
    
    if (filters?.min_tests) {
      params = params.set('min_tests', filters.min_tests.toString());
    }

    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params });
  }

  // Obtener estadísticas simples
  getSimpleDashboard(): Observable<SimpleDashboardStats> {
    return this.http.get<SimpleDashboardStats>(`${this.apiUrl}/simple`);
  }
}
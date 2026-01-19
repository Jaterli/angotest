import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';
import { UsersStatsFilters, UserStats, UserStatsFullResponse } from '../models/user-stats.models';


@Injectable({ providedIn: 'root' })
export class UsersManagementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin/users';

  // Método para obtener usuarios con estadísticas, paginación, filtrado y ordenación
  getUsersStats(filters: UsersStatsFilters = {}): Observable<UserStatsFullResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof UsersStatsFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si no se especificó página, usar valores por defecto
    if (!filters.current_page) {
      params = params.set('current_page', '1');
    }
    if (!filters.page_size) {
      params = params.set('page_size', '10');
    }
    if (!filters.sort_by) {
      params = params.set('sort_by', 'created_at');
    }
    if (!filters.sort_order) {
      params = params.set('sort_order', 'desc');
    }

    return this.http.get<UserStatsFullResponse>(`${this.apiUrl}/stats`, { params });
  }


  // Método para obtener perfil básico de usuario
  getUserProfile(id: number): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/${id}/profile`);
  }

  // Método para obtener un usuario específico con detalles completos
  getUserDetails(id: number): Observable<{ user: UserStats }> {
    return this.http.get<{ user: UserStats }>(`${this.apiUrl}/${id}/details`);
  }

  // Método para eliminar usuario
  deleteUser(id: number): Observable<{ message: string, deleted_user_id: string }> {
    return this.http.delete<{ message: string, deleted_user_id: string }>(
      `${this.apiUrl}/${id}/delete`
    );
  }

  // Método para obtener estadísticas generales del sistema
  // getSystemStats(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/system-stats`);
  // }

}
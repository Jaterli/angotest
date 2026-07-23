import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.models';
import { UserListResponse, UsersListFilters } from '../models/user-list.models';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class UsersManagementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/user`;

  // Método para obtener usuarios con estadísticas, paginación, filtrado y ordenación
  getUsersStats(filters: UsersListFilters): Observable<UserListResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof UsersListFilters];
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<UserListResponse>(`${this.apiUrl}/stats/`, { params });
  }

  // Método para obtener perfil básico de usuario
  getUserProfile(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}/profile/`);
  }

  // Método para eliminar usuario
  deleteUser(id: number): Observable<{ message: string, deleted_user_id: string }> {
    return this.http.delete<{ message: string, deleted_user_id: string }>(
      `${this.apiUrl}/${id}/delete/`
    );
  }

}
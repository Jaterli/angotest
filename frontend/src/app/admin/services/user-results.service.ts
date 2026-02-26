import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResultsResponse, UserResultDetailsResponse, UserResultsRequest } from '../models/user-results.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserResultsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getUserResults(userId: number, filters: UserResultsRequest = {}): Observable<UserResultsResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof UserResultsRequest];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Valores por defecto (solo si no están presentes en filters)
    if (!filters.page) {
      params = params.set('page', '1');
    }
    if (!filters.page_size) {
      params = params.set('page_size', '20');
    }
    if (!filters.sort_by) {
      params = params.set('sort_by', 'updated_at');
    }
    if (!filters.sort_order) {
      params = params.set('sort_order', 'desc');
    }
    // Nota: 'status' por defecto se maneja en el backend cuando viene vacío
    // No forzamos 'all' para permitir que el backend use su valor por defecto

    return this.http.get<UserResultsResponse>(`${this.apiUrl}/users/${userId}/results`, { params });
  }

  // Método para obtener detalles de resultados
  getResultDetails(userId: number, resultId: number): Observable<UserResultDetailsResponse> {
    return this.http.get<UserResultDetailsResponse>(
      `${this.apiUrl}/users/${userId}/results/${resultId}`
    );
  }

  // Eliminar resultado individual
  deleteResult(resultId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/results/${resultId}`);
  }
}
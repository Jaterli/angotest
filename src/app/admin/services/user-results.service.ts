import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultDetailsResponse, UserResultsData, UserResultsFilters } from '../models/user-results.model';


@Injectable({ providedIn: 'root' })
export class UserResultsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin';

  getUserResults(userId: number, filters: UserResultsFilters = {}): Observable<UserResultsData> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof UserResultsFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Valores por defecto
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
    if (!filters.status) {
      params = params.set('status', 'all');
    }

    return this.http.get<UserResultsData>(`${this.apiUrl}/users/${userId}/results`, { params });
  }

  // Método para obtener detalles de resultados
  getResultDetails(userId: number, resultId: number): Observable<ResultDetailsResponse> {
    return this.http.get<ResultDetailsResponse>(
      `${this.apiUrl}/users/${userId}/results/${resultId}/details`
    );
  }

  // Eliminar resultado individual
  deleteResult(resultId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/results/${resultId}`);
  }

}
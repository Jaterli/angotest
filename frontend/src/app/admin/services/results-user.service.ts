import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResultsUserFilters, ResultsUserResponse, ResultUserDetailsResponse } from '../models/results-user.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResultsUserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/results`;

  getUserResults(userId: number, filters: ResultsUserFilters): Observable<ResultsUserResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ResultsUserFilters];
      if (value != 'all' && value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ResultsUserResponse>(`${this.apiUrl}/user/${userId}/`, { params });
  }

  // Método para obtener detalles de resultados
  getResultDetails(userId: number, resultId: number): Observable<ResultUserDetailsResponse> {
    return this.http.get<ResultUserDetailsResponse>(
      `${this.apiUrl}/${resultId}/user/${userId}/`
    );
  }

  // Eliminar resultado individual
  deleteResult(resultId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${resultId}/delete/`);
  }
}
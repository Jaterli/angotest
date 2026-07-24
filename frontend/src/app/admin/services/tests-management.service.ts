import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Test, TestFilters, TestsListResponse } from '../../shared/models/test.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TestsManagementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/test/admin`;


  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/${id}/`);
  }

  createTest(test: Test): Observable<any> {
    return this.http.post(`${this.apiUrl}/create/`, test);
  }

  updateTest(id: number, test: Test): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/edit/`, test);
  }

  deleteTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/delete/`);
  }

  // Método para obtener tests con paginación, filtrado y ordenación
  getAllTests(filter: TestFilters): Observable<TestsListResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof TestFilters];
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        params = params.set(key, value.toString());
      }
    });
  
    return this.http.get<TestsListResponse>(`${this.apiUrl}/list/`, { params });
  }

}
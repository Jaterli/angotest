import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Test, TestsFilterOptions, TestsListFilters, TestsListResponse } from '../../models/test.model';


@Injectable({ providedIn: 'root' })
export class TestsManagementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin/tests';


  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/${id}`);
  }

  createTest(test: Test): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, test);
  }

  updateTest(id: number, test: Test): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/edit`, test);
  }

  deleteTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/delete`);
  }

  // Método para obtener tests con paginación, filtrado y ordenación
  getAllTests(filters: TestsListFilters): Observable<TestsListResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof TestsListFilters];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    // Si no se especificó página, usar valores por defecto
    if (!filters.page) {
      params = params.set('page', '1');
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

    return this.http.get<TestsListResponse>(`${this.apiUrl}/all`, { params });
  }

  // Método para obtener opciones de filtrado
  getFilterOptions(): Observable<TestsFilterOptions> {
    return this.http.get<TestsFilterOptions>(`${this.apiUrl}/filter-options`);
  }


  // Método para obtener estadísticas generales del sistema
  // getSystemStats(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/system-stats`);
  // }

}
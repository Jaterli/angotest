import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminResultsFilter, AdminResultsFullResponse } from '../models/admin-results.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  // Obtener resultados con filtros para administración
  getAdminResults(filter: AdminResultsFilter = {}): Observable<AdminResultsFullResponse> {
    let params = new HttpParams();
    
    // Parámetros básicos
    params = params.set('page', (filter.page || 1).toString());
    params = params.set('page_size', (filter.page_size || 20).toString());
    
    // Parámetros de usuario
    if (filter.user_id) {
      params = params.set('user_id', filter.user_id.toString());
    }
    
    if (filter.user_role && filter.user_role !== 'all') {
      params = params.set('user_role', filter.user_role);
    }
    
    if (filter.user_email) {
      params = params.set('user_email', filter.user_email);
    }
    
    if (filter.user_username) {
      params = params.set('user_username', filter.user_username);
    }
    
    // Parámetros de test
    if (filter.test_id) {
      params = params.set('test_id', filter.test_id.toString());
    }
    
    if (filter.test_title) {
      params = params.set('test_title', filter.test_title);
    }
    
    if (filter.test_main_topic && filter.test_main_topic !== 'all') {
      params = params.set('test_main_topic', filter.test_main_topic);
    }
    
    if (filter.test_sub_topic && filter.test_sub_topic !== 'all') {
      params = params.set('test_sub_topic', filter.test_sub_topic);
    }
    
    if (filter.test_level && filter.test_level !== 'all') {
      params = params.set('test_level', filter.test_level);
    }
    
    if (filter.test_created_by) {
      params = params.set('test_created_by', filter.test_created_by.toString());
    }
    
    if (filter.test_is_active !== undefined) {
      params = params.set('test_is_active', filter.test_is_active.toString());
    }
    
    // Parámetros de resultado
    if (filter.status && filter.status !== 'all') {
      params = params.set('status', filter.status);
    }
    
    if (filter.min_score !== undefined) {
      params = params.set('min_score', filter.min_score.toString());
    }
    
    if (filter.max_score !== undefined) {
      params = params.set('max_score', filter.max_score.toString());
    }
    
    if (filter.min_time_taken !== undefined) {
      params = params.set('min_time_taken', filter.min_time_taken.toString());
    }
    
    if (filter.max_time_taken !== undefined) {
      params = params.set('max_time_taken', filter.max_time_taken.toString());
    }
    
    // Fechas
    if (filter.start_date) {
      params = params.set('start_date', filter.start_date);
    }
    
    if (filter.end_date) {
      params = params.set('end_date', filter.end_date);
    }
    
    // Ordenamiento
    if (filter.sort_by) {
      params = params.set('sort_by', filter.sort_by);
    }
    
    if (filter.sort_order) {
      params = params.set('sort_order', filter.sort_order);
    }
    
    // Búsqueda
    if (filter.search) {
      params = params.set('search', filter.search);
    }

    return this.http.get<AdminResultsFullResponse>(
      `${this.apiUrl}/results`, 
      { params }
    );
  }

}
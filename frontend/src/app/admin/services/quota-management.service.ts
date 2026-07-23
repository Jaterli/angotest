// src/app/features/quota/services/quota-management.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuotaResponse, QuotaFilter, CreateQuotaInput, UpdateQuotaInput, UserQuota } from '../models/quota-management.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuotaManagementService {
  private apiUrl = `${environment.apiUrl}/admin/quotas`;

  constructor(private http: HttpClient) {}


  getQuotas(filters: QuotaFilter): Observable<QuotaResponse> {
    let params = new HttpParams();

    // Agregar todos los filtros a los parámetros
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof QuotaFilter];
      if (value != undefined && value !== null && value !== 'all' && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<QuotaResponse>(`${this.apiUrl}`, { params });
  }

  // Obtener cuota por ID de usuario
  getUserQuota(userId: number, monthYear?: string): Observable<{ quota: UserQuota }> {
    let params = new HttpParams();
    if (monthYear) {
      params = params.set('month_year', monthYear);
    }
    return this.http.get<{ quota: UserQuota }>(`${this.apiUrl}/user/${userId}/`, { params });
  }

  // Crear cuota
  createQuota(data: CreateQuotaInput): Observable<{ quota: UserQuota; message: string }> {
    return this.http.post<{ quota: UserQuota; message: string }>(
      `${this.apiUrl}/create/`,
      data
    );
  }

  // Actualizar cuota
  updateQuota(id: number, data: UpdateQuotaInput): Observable<{ quota: UserQuota; message: string }> {
    return this.http.put<{ quota: UserQuota; message: string }>(
      `${this.apiUrl}/${id}/update/`,
      data
    );
  }

  // Eliminar cuota
  deleteQuota(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}/delete/`);
  }

  // Eliminar múltiples cuotas
  deleteQuotasBulk(ids: number[]): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/bulk-delete/`, {
      body: { ids }
    });
  }

  // Obtener meses disponibles para un usuario
  getUserQuotaMonths(userId: number): Observable<{ months: string[] }> {
    return this.http.get<{ months: string[] }>(`${this.apiUrl}/user/${userId}/months/`);
  }

  // Verificar si hay cuota disponible
  checkQuotaAvailability(userId: number): Observable<{ 
    available: boolean; 
    quota: UserQuota;
    message: string;
  }> {
    return this.http.get<{ available: boolean; quota: UserQuota; message: string }>(
      `${this.apiUrl}/me/check/`
    );
  }
}
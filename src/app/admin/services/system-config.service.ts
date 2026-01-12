import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SystemConfig, 
  CreateSystemConfigDTO, 
  UpdateSystemConfigDTO,
  BulkUpdateConfigDTO
} from '../models/system-config.model';

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/admin/system-configs';

  // Obtener todas las configuraciones
  getAll(): Observable<SystemConfig[]> {
    return this.http.get<SystemConfig[]>(this.baseUrl);
  }

  // Obtener configuración por ID
  getById(id: number): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.baseUrl}/${id}`);
  }

  // Obtener configuración por clave
  getByKey(key: string): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.baseUrl}/key/${key}`);
  }

  // Crear nueva configuración
  create(config: CreateSystemConfigDTO): Observable<SystemConfig> {
    return this.http.post<SystemConfig>(this.baseUrl, config);
  }

  // Actualizar configuración
  update(id: number, config: UpdateSystemConfigDTO): Observable<SystemConfig> {
    return this.http.put<SystemConfig>(`${this.baseUrl}/${id}`, config);
  }

  // Eliminar configuración
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Actualización masiva
  bulkUpdate(configs: BulkUpdateConfigDTO[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bulk-update`, configs);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  SystemConfig, 
  CreateSystemConfigDTO, 
  UpdateSystemConfigDTO,
  BulkUpdateConfigDTO,
  DefaultSystemConfig,
  SystemConfigResponse,
  SystemConfigFilters
} from '../models/system-config.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/system-configs`;

  getAll(filter: SystemConfigFilters): Observable<SystemConfigResponse> {
    let params = new HttpParams();
    
    // Agregar todos los filtros a los parámetros
    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof SystemConfigFilters];
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return this.http.get<SystemConfigResponse>(`${this.apiUrl}/`, { params });
  }

  getAllDefault(): Observable<DefaultSystemConfig[]> {
    return this.http.get<DefaultSystemConfig[]>(`${this.apiUrl}/default/`);
  }

  // Obtener configuración por ID
  getById(id: number): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.apiUrl}/${id}`);
  }

  // Obtener configuración por clave
  getByKey(key: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/key/${key}/`, { responseType: 'text' });
  }

  // Crear nueva configuración
  create(config: CreateSystemConfigDTO): Observable<SystemConfig> {
    return this.http.post<SystemConfig>(this.apiUrl + '/create/', config);
  }

  // Actualizar configuración
  update(id: number, config: UpdateSystemConfigDTO): Observable<SystemConfig> {
    return this.http.put<SystemConfig>(`${this.apiUrl}/${id}/update/`, config);
  }

  // Eliminar configuración
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/delete/`);
  }

}
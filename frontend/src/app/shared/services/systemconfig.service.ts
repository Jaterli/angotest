import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SystemConfigServiceForUser {
  private apiUrl = `${environment.apiUrl}/system-configsForUser`;

  constructor(private http: HttpClient) {}

    
  // Obtener configuración por clave
  getSystemConfigByKey(key: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/key/${key}`, { responseType: 'text' });
}
}
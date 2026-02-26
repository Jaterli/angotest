import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateEmailPassword, UserUpdateData } from '../models/user.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })

export class UserService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/profile`;


  user = signal<any | null>(null);

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  // Actualizar datos del usuario
  updateUser(userData: UserUpdateData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userData);
  }

  // Actualiza credenciales de acceso
  updateEmailPassword(data: UpdateEmailPassword): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-email-password`, data);
  }

  // Actualiza perfil de guest
  updateGuestProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-guest-profile`, data);
  }

  // Deactivar cuenta (soft delete)
  deactivateAccount(data: { current_password: string; confirm_text: string }): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deactivate-account`, {
      body: data // Enviar datos en el cuerpo de la solicitud
    });
  }

}

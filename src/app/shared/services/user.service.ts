import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangePasswordData, UserUpdateData } from '../models/user.model';

@Injectable({ providedIn: 'root' })

export class UserService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/profile';


  user = signal<any | null>(null);

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  // Actualizar datos del usuario
  updateUser(userData: UserUpdateData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userData);
  }

  // Cambiar contraseña
  changePassword(passwordData: ChangePasswordData): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData);
  }

}

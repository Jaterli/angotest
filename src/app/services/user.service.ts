import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStats } from '../models/user-stats.model';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';


  user = signal<any | null>(null);


  getUserDetails(id: number) {
    return this.http.get<{ user: any }>(`${this.apiUrl}/admin/users/details/${id}`);
  }


  // Método para eliminar usuario
  deleteUser(id: number): Observable<{ message: string, deleted_user_id: string }> {
    return this.http.delete<{ message: string, deleted_user_id: string }>(
      `${this.apiUrl}/admin/users/delete/${id}`
    );
  }


  // Método para obtener estadísticas de usuarios
  getUsersStats(): Observable<UserStats[]> {
    return this.http.get<{ users: UserStats[] }>(`${this.apiUrl}/admin/users/stats`).pipe(
      // transformamos para devolver solo el array
      map(res => res.users)
    );
  }


}

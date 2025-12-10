import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin/users';


  user = signal<any | null>(null);


  getUserDetails(id: number) {
    return this.http.get<{ user: any }>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserStats } from '../models/user-stats.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserStatsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/admin/users/stats';

  getUsersStats(): Observable<UserStats[]> {
    return this.http.get<{ users: UserStats[] }>(this.apiUrl).pipe(
      // transformamos para devolver solo el array
      map(res => res.users)
    );
  }
}

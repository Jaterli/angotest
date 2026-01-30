import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  TestInvitation, 
  CreateInvitationInput, 
  CheckInvitationResponse,
  AcceptInvitationResponse
} from '../models/invitation.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  // Crear invitación
  createInvitation(data: CreateInvitationInput): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitations/create`, data);
  }

  // Obtener invitaciones del usuario
  getMyInvitations(): Observable<{invitations: TestInvitation[]}> {
    return this.http.get<{invitations: TestInvitation[]}>(`${this.apiUrl}/invitations/my-invitations`);
  }

  // Verificar invitación
  checkInvitation(token: string): Observable<CheckInvitationResponse> {
    return this.http.get<CheckInvitationResponse>(`${this.apiUrl}/invitation/check-invitation?token=${token}`);
  }

  // Aceptar invitación
  acceptInvitation(token: string, asGuest?: boolean): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(
      `${this.apiUrl}/invitation/accept-invitation?token=${token}`,
      { as_guest: asGuest || false }
    );
  }
}
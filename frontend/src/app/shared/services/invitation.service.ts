import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  TestInvitation, 
  CreateInvitationInput, 
  CheckInvitationResponse,
  AcceptInvitationResponse
} from '../models/invitation.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invitations`;

  // Crear invitación
  createInvitation(data: CreateInvitationInput): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  // Obtener invitaciones del usuario
  getMyInvitations(): Observable<{invitations: TestInvitation[]}> {
    return this.http.get<{invitations: TestInvitation[]}>(`${this.apiUrl}/my-invitations`);
  }

  // Verificar invitación
  checkInvitation(token: string): Observable<CheckInvitationResponse> {
    return this.http.get<CheckInvitationResponse>(`${this.apiUrl}/check-invitation?token=${token}`);
  }

  // Aceptar invitación
  acceptInvitation(token: string, asGuest?: boolean): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(
      `${this.apiUrl}/accept-invitation?token=${token}`,
      { as_guest: asGuest || false }
    );
  }
}
import { Injectable } from "@angular/core";
import { AIRequestStatus, CurrentUserQuota, GenerateTestRequest } from "../models/generate-test.models";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AITestService {
  private apiUrl = `${environment.apiUrl}/ai-requests`;

  constructor(private http: HttpClient) {}
  
  // Solicitar generación de test
  generateTest(request: GenerateTestRequest): Observable<AIRequestStatus> {
    return this.http.post<AIRequestStatus>(`${this.apiUrl}/generate-ai-test`, request);
  }
     
  // Obtener solicitudes del usuario
  getUserRequests(): Observable<AIRequestStatus[]> {
    return this.http.get<AIRequestStatus[]>(`${this.apiUrl}/requests`);
  }
  
  // Obtener quota del usuario
  getCurrentUserQuota(): Observable<CurrentUserQuota> {
    return this.http.get<CurrentUserQuota>(`${this.apiUrl}/quota`);
  }
}
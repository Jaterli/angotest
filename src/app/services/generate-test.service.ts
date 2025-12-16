import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AIRequestStatus, GenerateTestRequest, UserQuota } from "../models/generate-test.model";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class AITestService {
  private apiUrl = 'http://localhost:8080/api/ai';
  
  constructor(private http: HttpClient) {}
  
  // Solicitar generación de test
  generateTest(request: GenerateTestRequest): Observable<AIRequestStatus> {
    return this.http.post<AIRequestStatus>(`${this.apiUrl}/generate`, request);
  }
  
  // Obtener estado de una solicitud
  getRequestStatus(requestId: number): Observable<AIRequestStatus> {
    return this.http.get<AIRequestStatus>(`${this.apiUrl}/requests/${requestId}`);
  }
  
  // Obtener solicitudes del usuario
  getUserRequests(): Observable<AIRequestStatus[]> {
    return this.http.get<AIRequestStatus[]>(`${this.apiUrl}/requests`);
  }
  
  // Obtener quota del usuario
  getUserQuota(): Observable<UserQuota> {
    return this.http.get<UserQuota>(`${this.apiUrl}/quota`);
  }
}
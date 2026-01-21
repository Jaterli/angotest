import { Injectable } from "@angular/core";
import { AIRequestStatus, GenerateTestRequest, UserQuota } from "../models/generate-test.model";
import { HttpClient } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators"; 

@Injectable({ providedIn: 'root' })
export class AITestService {
  private apiUrl = 'http://localhost:8080/api/ai-requests';

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
  getUserQuota(): Observable<UserQuota> {
    return this.http.get<UserQuota>(`${this.apiUrl}/quota`);
  }
}
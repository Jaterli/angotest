import { Injectable } from "@angular/core";
import { AIRequestStatus, GenerateTestRequest, TopicsResponse, UserQuota } from "../models/generate-test.model";
import { HttpClient } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators"; 

@Injectable({ providedIn: 'root' })
export class AITestService {
  private apiUrl = 'http://localhost:8080/api/ai';
  private topicsCache: TopicsResponse | null = null;
  private topicsCacheTime: number = 0;
  private cacheDuration = 5 * 60 * 1000; // 5 minutos
  
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

  // Obtener temas predefinidos desde el backend
  getPredefinedTopics(): Observable<TopicsResponse> {
    const now = Date.now();
    
    // Si hay cache válido, devolverlo
    if (this.topicsCache && (now - this.topicsCacheTime) < this.cacheDuration) {
      return of(this.topicsCache);
    }
    
    // Si no, hacer la petición
    return this.http.get<TopicsResponse>(`${this.apiUrl}/topics`).pipe(
      tap(response => {
        this.topicsCache = response;
        this.topicsCacheTime = now;
      }),
      catchError(error => {
        console.error('Error al cargar temas:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener categorías para un tema
  getCategoriesForTopic(topic: string): Observable<{topic: string, categories: string[], count: number}> {
    return this.http.get<{topic: string, categories: string[], count: number}>(
      `${this.apiUrl}/categories?topic=${encodeURIComponent(topic)}`
    );
  }

}
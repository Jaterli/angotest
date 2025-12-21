import { Injectable } from "@angular/core";
import { AIRequestStatus, GenerateTestRequest, TopicsResponse, UserQuota } from "../../models/generate-test.model";
import { HttpClient } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators"; 

@Injectable({ providedIn: 'root' })
export class AITestService {
  private apiUrl = 'http://localhost:8080/api/ai-requests';
  private mainTopicsCache: string[] | null = null;
  private mainTopicsCacheTime: number = 0;
  private cacheDuration = 5 * 60 * 1000;
  
  constructor(private http: HttpClient) {}
  
  // Solicitar generación de test
  generateTest(request: GenerateTestRequest): Observable<AIRequestStatus> {
    return this.http.post<AIRequestStatus>(`${this.apiUrl}/generate-ai-test`, request);
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

  // Obtener temas principales
  getMainTopics(): Observable<{main_topics: string[], count: number}> {
    const now = Date.now();
    
    if (this.mainTopicsCache && (now - this.mainTopicsCacheTime) < this.cacheDuration) {
      return of({ main_topics: this.mainTopicsCache, count: this.mainTopicsCache.length });
    }
    
    return this.http.get<{main_topics: string[], count: number}>(`${this.apiUrl}/main-topics`).pipe(
      tap(response => {
        this.mainTopicsCache = response.main_topics;
        this.mainTopicsCacheTime = now;
      }),
      catchError(error => {
        console.error('Error al cargar temas principales:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener subtemas para un tema principal
  getSubTopics(mainTopic: string): Observable<{main_topic: string, sub_topics: string[], count: number}> {
    return this.http.get<{main_topic: string, sub_topics: string[], count: number}>(
      `${this.apiUrl}/sub-topics?main_topic=${encodeURIComponent(mainTopic)}`
    );
  }

  // Obtener temas específicos para un tema principal y subtema
  getSpecificTopics(mainTopic: string, subTopic: string): Observable<{main_topic: string, sub_topic: string, specific_topics: string[], count: number}> {
    return this.http.get<{main_topic: string, sub_topic: string, specific_topics: string[], count: number}>(
      `${this.apiUrl}/specific-topics?main_topic=${encodeURIComponent(mainTopic)}&sub_topic=${encodeURIComponent(subTopic)}`
    );
  }

  // Obtener toda la jerarquía de temas (opcional)
  getFullTopicHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/full-hierarchy`);
  }
}
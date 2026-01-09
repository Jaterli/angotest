import { catchError, Observable, of, throwError } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { 
  DashboardStats, 
  RankingsResponse 
} from "../models/user-dashboard.model";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  private readonly baseUrl = 'http://localhost:8080/api/dashboard';
  
  /**
   * Obtiene solo las estadísticas del usuario (sin comparativas)
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/personaldata`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene rankings completos con datos comparativos
   * @param limit Número máximo de resultados por ranking
   */
  getRankings(limit: number = 5): Observable<RankingsResponse> {
    return this.http.get<RankingsResponse>(`${this.baseUrl}/rankings?limit=${limit}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Calcula la precisión basada en intentos
   */
  calculateAccuracy(attemptData: any): number {
    if (!attemptData) return 0;
    
    const total = (attemptData.total_correct || 0) + (attemptData.total_wrong || 0);
    return total > 0 ? (attemptData.total_correct / total) * 100 : 0;
  }

  /**
   * Calcula el tiempo promedio por pregunta
   */
  calculateAverageTimePerQuestion(attemptData: any): number {
    if (!attemptData || !attemptData.total_questions_answered || attemptData.total_questions_answered === 0) {
      return 0;
    }
    
    return attemptData.total_time_taken / attemptData.total_questions_answered;
  }

  /**
   * Formatea tiempo en segundos a string legible
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Dashboard Service Error:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || error.message || `Error ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DashboardSummary, DashboardData, RankingsData, PersonalStats, TimeStats, AccuracyStats, RankingStats, RankingPosition, ProgressData } from '../models/user-dashboard.model';



@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  private cachedDashboardData: DashboardSummary | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

  /**
   * Obtiene todas las estadísticas del dashboard
   */
  getDashboardStats(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los rankings completos
   * @param limit Número máximo de resultados por ranking (por defecto 10)
   */
  getRankings(limit: number = 10): Observable<RankingsData> {
    return this.http.get<RankingsData>(`${this.apiUrl}/rankings?limit=${limit}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene datos del dashboard con caché
   */
  getDashboardWithCache(forceRefresh: boolean = false): Observable<DashboardSummary> {
    const now = Date.now();
    
    // Si hay caché válido y no se fuerza refresco
    if (!forceRefresh && 
        this.cachedDashboardData && 
        (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return new Observable(observer => {
        observer.next(this.cachedDashboardData!);
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.getDashboardStats().subscribe({
        next: (dashboardData) => {
          const summary: DashboardSummary = {
            ...dashboardData,
            last_updated: new Date()
          };
          
          this.cachedDashboardData = summary;
          this.cacheTimestamp = now;
          
          observer.next(summary);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Obtiene estadísticas de tiempo formateadas
   */
  getFormattedTimeStats(personalStats: PersonalStats): TimeStats {
    const totalTests = personalStats.tests_completed;
    
    return {
      average_time_per_test: this.formatTime(personalStats.average_time),
      average_time_first_attempt: this.formatTime(personalStats.average_time_first),
      total_time_invested: this.formatTime(personalStats.total_time),
      efficiency_score: this.calculateEfficiencyScore(personalStats)
    };
  }

  /**
   * Obtiene estadísticas de precisión
   */
  getAccuracyStats(personalStats: PersonalStats): AccuracyStats {
    const totalAnswers = personalStats.total_correct + personalStats.total_incorrect;
    const accuracy = totalAnswers > 0 
      ? (personalStats.total_correct / totalAnswers) * 100 
      : 0;

    return {
      accuracy_percentage: accuracy,
      total_answers: totalAnswers,
      correct_answers: personalStats.total_correct,
      incorrect_answers: personalStats.total_incorrect
    };
  }

  /**
   * Calcula las posiciones del usuario en los rankings
   */
  getRankingPositions(rankingStats: RankingStats): RankingPosition[] {
    const positions: RankingPosition[] = [
      {
        category: 'Tests Completados',
        position: rankingStats.rank_by_tests,
        total_participants: rankingStats.total_rank_by_tests,
        percentile: this.calculatePercentile(rankingStats.rank_by_tests, rankingStats.total_rank_by_tests),
        value: 0, // Este valor vendría del personal_stats
        formatted_value: `#${rankingStats.rank_by_tests} de ${rankingStats.total_rank_by_tests}`
      },
      {
        category: 'Tiempo Promedio',
        position: rankingStats.rank_by_avg_time,
        total_participants: rankingStats.total_rank_by_avg_time,
        percentile: this.calculatePercentile(rankingStats.rank_by_avg_time, rankingStats.total_rank_by_avg_time),
        value: 0, // Este valor vendría del personal_stats
        formatted_value: `#${rankingStats.rank_by_avg_time} de ${rankingStats.total_rank_by_avg_time}`
      },
      {
        category: 'Primera Versión',
        position: rankingStats.rank_by_avg_time_first,
        total_participants: rankingStats.total_rank_by_avg_time, // Mismo que tiempo promedio
        percentile: this.calculatePercentile(rankingStats.rank_by_avg_time_first, rankingStats.total_rank_by_avg_time),
        value: 0, // Este valor vendría del personal_stats
        formatted_value: `#${rankingStats.rank_by_avg_time_first}`
      }
    ];

    return positions;
  }

  /**
   * Obtiene datos de progreso del usuario
   */
  getProgressData(): Observable<ProgressData> {
    return this.http.get<ProgressData>(`${this.apiUrl}/progress`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Formatea segundos a un string legible
   */
  formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Calcula el percentil de una posición
   */
  calculatePercentile(position: number, total: number): number {
    if (total === 0 || position === 0) return 0;
    return Math.round(((total - position + 1) / total) * 100);
  }

  /**
   * Calcula porcentaje para gráfico circular
   */
  getCirclePercentage(position: number, total: number): number {
    return this.calculatePercentile(position, total);
  }

  /**
   * Calcula un score de eficiencia basado en tiempo y precisión
   */
  private calculateEfficiencyScore(personalStats: PersonalStats): number {
    if (personalStats.tests_completed === 0) return 0;
    
    const accuracy = this.getAccuracyStats(personalStats).accuracy_percentage;
    const avgTime = personalStats.average_time;
    
    // Puntuación basada en precisión (70%) y tiempo (30%)
    const timeScore = avgTime > 0 ? Math.min(100, (300 / avgTime) * 100) : 0;
    
    return Math.round((accuracy * 0.7) + (timeScore * 0.3));
  }

  /**
   * Obtiene la clase CSS para el badge de nivel
   */
  getLevelBadgeClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'principiante':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'avanzado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  /**
   * Obtiene la clase CSS para el color de precisión
   */
  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 70) return 'text-blue-600 dark:text-blue-400';
    if (accuracy >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  /**
   * Obtiene un mensaje según la puntuación
   */
  getScoreMessage(score: number): string {
    if (score >= 95) return '¡Excelente!';
    if (score >= 85) return 'Muy bien';
    if (score >= 70) return 'Buen trabajo';
    if (score >= 60) return 'Puedes mejorar';
    return 'Sigue practicando';
  }

  /**
   * Limpia la caché del dashboard
   */
  clearCache(): void {
    this.cachedDashboardData = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Verifica si la caché está expirada
   */
  isCacheExpired(): boolean {
    return (Date.now() - this.cacheTimestamp) > this.CACHE_DURATION;
  }

  /**
   * Obtiene el tiempo desde la última actualización
   */
  getTimeSinceLastUpdate(): string {
    if (!this.cacheTimestamp) return 'Nunca';
    
    const now = Date.now();
    const diff = now - this.cacheTimestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  }

  /**
   * Maneja errores de las peticiones HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('Dashboard Service Error:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.error || error.message || `Error ${error.status}: ${error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
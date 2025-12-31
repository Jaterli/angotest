import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DashboardStats, RankingsResponse, PersonalStats, TimeStats, AccuracyStats, RankingStats, RankingPosition, LevelStats } from '../models/user-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/dashboard';

  private cachedDashboardData: DashboardStats | null = null;
  private cachedRankingsData: RankingsResponse | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

  /**
   * Obtiene todas las estadísticas del dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los rankings completos
   * @param limit Número máximo de resultados por ranking (por defecto 10)
   */
  getRankings(limit: number = 10): Observable<RankingsResponse> {
    return this.http.get<RankingsResponse>(`${this.apiUrl}/rankings?limit=${limit}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene datos del dashboard con caché
   */
  getDashboardWithCache(forceRefresh: boolean = false): Observable<DashboardStats> {
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
        next: (data) => {
          this.cachedDashboardData = data;
          this.cacheTimestamp = now;
          
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Obtiene rankings con caché
   */
  getRankingsWithCache(limit: number = 10, forceRefresh: boolean = false): Observable<RankingsResponse> {
    const now = Date.now();
    
    // Si hay caché válido y no se fuerza refresco
    if (!forceRefresh && 
        this.cachedRankingsData && 
        (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return new Observable(observer => {
        observer.next(this.cachedRankingsData!);
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.getRankings(limit).subscribe({
        next: (data) => {
          this.cachedRankingsData = data;
          this.cacheTimestamp = now;
          
          observer.next(data);
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
    return {
      average_time_per_question: this.formatTime(personalStats.average_time_per_question),
      average_time_first_attempt: this.formatTime(personalStats.average_time_per_question_first_attempt),
      total_time_invested: this.formatTime(personalStats.total_time),
      efficiency_score: this.calculateEfficiencyScore(personalStats)
    };
  }

  /**
   * Obtiene estadísticas de precisión
   */
  getAccuracyStats(personalStats: PersonalStats): AccuracyStats {
    const totalCorrectAll = personalStats.total_correct.all_attempts;
    const totalIncorrectAll = personalStats.total_incorrect.all_attempts;
    const totalAnswers = totalCorrectAll + totalIncorrectAll;
    const accuracy = totalAnswers > 0 
      ? (totalCorrectAll / totalAnswers) * 100 
      : 0;

    return {
      accuracy_percentage: accuracy,
      total_answers: totalAnswers,
      correct_answers: totalCorrectAll,
      incorrect_answers: totalIncorrectAll
    };
  }

  /**
   * Obtiene estadísticas de nivel detalladas
   */
  getLevelComparisonStats(levelStats: LevelStats, communityLevelStats: any): any {
    if (!levelStats || !communityLevelStats) return null;
    
    const improvement = {
      time_all: this.calculateImprovement(
        levelStats.all_attempts.average_time_per_question,
        communityLevelStats.avg_time_per_question_all,
        false // menor es mejor para tiempo
      ),
      accuracy_all: this.calculateImprovement(
        levelStats.all_attempts.average_score,
        communityLevelStats.avg_accuracy_all,
        true // mayor es mejor para precisión
      ),
      tests_count: levelStats.all_attempts.tests_count,
      community_avg_tests: communityLevelStats.avg_tests_per_user
    };
    
    return improvement;
  }

  /**
   * Calcula el porcentaje de mejora vs comunidad
   */
  private calculateImprovement(userValue: number, communityValue: number, higherIsBetter: boolean): number {
    if (!communityValue || communityValue === 0) return 0;
    
    if (higherIsBetter) {
      // Para precisión: (user - community) / community * 100
      return ((userValue - communityValue) / communityValue) * 100;
    } else {
      // Para tiempo: (community - user) / community * 100
      return ((communityValue - userValue) / communityValue) * 100;
    }
  }

  /**
   * Calcula las posiciones del usuario en los rankings
   */
  getRankingPositions(rankingStats: RankingStats, rankingsResponse?: RankingsResponse): RankingPosition[] {
    const totalUsers = rankingStats.total_rank_by_avg_time || rankingStats.total_rank_by_tests || 1;
    
    // Usar percentiles del endpoint de rankings si están disponibles
    let timePercentile = this.calculatePercentile(rankingStats.rank_by_avg_time_per_question || 0, totalUsers);
    let firstAttemptPercentile = this.calculatePercentile(rankingStats.rank_by_avg_time_per_question_first || 0, totalUsers);
    let testsPercentile = 0;
    let accuracyPercentile = 0;

    if (rankingsResponse?.percentile) {
      timePercentile = rankingsResponse.percentile.time_per_question_all || timePercentile;
      firstAttemptPercentile = rankingsResponse.percentile.time_per_question_first || firstAttemptPercentile;
      testsPercentile = rankingsResponse.percentile.tests_completed || 0;
      accuracyPercentile = rankingsResponse.percentile.accuracy_all || 0;
    }

    const positions: RankingPosition[] = [
      {
        category: 'Tiempo Promedio',
        position: rankingStats.rank_by_avg_time_per_question || 0,
        total_participants: totalUsers,
        percentile: timePercentile,
        value: 0,
        formatted_value: `#${rankingStats.rank_by_avg_time_per_question || 0} de ${totalUsers}`
      },
      {
        category: 'Primer Intento',
        position: rankingStats.rank_by_avg_time_per_question_first || 0,
        total_participants: totalUsers,
        percentile: firstAttemptPercentile,
        value: 0,
        formatted_value: `#${rankingStats.rank_by_avg_time_per_question_first || 0} de ${totalUsers}`
      },
      {
        category: 'Tests Completados',
        position: rankingsResponse?.my_position?.tests || 0,
        total_participants: rankingStats.total_users || 1,
        percentile: testsPercentile,
        value: 0,
        formatted_value: `#${rankingsResponse?.my_position?.tests || 0} de ${rankingStats.total_users || 1}`
      },
      {
        category: 'Precisión',
        position: rankingsResponse?.my_position?.accuracy_all || 0,
        total_participants: totalUsers,
        percentile: accuracyPercentile,
        value: 0,
        formatted_value: `#${rankingsResponse?.my_position?.accuracy_all || 0} de ${totalUsers}`
      }
    ];

    return positions;
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
   * Formatea tiempo en segundos a formato mm:ss
   */
  formatTimeShort(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (minutes > 0) {
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
   * Calcula un score de eficiencia basado en tiempo y precisión
   */
  private calculateEfficiencyScore(personalStats: PersonalStats): number {
    if (personalStats.tests_completed === 0) return 0;
    
    const accuracy = this.getAccuracyStats(personalStats).accuracy_percentage;
    const avgTime = personalStats.average_time_per_question;
    
    // Puntuación basada en precisión (70%) y tiempo (30%)
    const timeScore = avgTime > 0 ? Math.min(100, (300 / avgTime) * 100) : 0;
    
    return Math.round((accuracy * 0.7) + (timeScore * 0.3));
  }

  /**
   * Calcula estadísticas comparativas con la comunidad
   */
  getCommunityComparison(rankingsResponse: RankingsResponse): any {
    if (!rankingsResponse) return null;

    return {
      time_improvement: this.calculateImprovementPercentage(
        rankingsResponse.my_position.avg_time_per_question_all,
        rankingsResponse.community_averages.avg_time_per_question_all,
        false
      ),
      accuracy_improvement: this.calculateImprovementPercentage(
        rankingsResponse.my_position.accuracy_all,
        rankingsResponse.community_averages.accuracy_all,
        true
      ),
      community_avg_time: rankingsResponse.community_averages.avg_time_per_question_all,
      community_avg_accuracy: rankingsResponse.community_averages.accuracy_all
    };
  }

  private calculateImprovementPercentage(userPosition: number, communityAvg: number, higherIsBetter: boolean): number {
    // Esta es una simplificación - en realidad necesitaríamos el valor real del usuario
    // Por ahora, usamos la posición como proxy
    return 0;
  }

  /**
   * Limpia la caché del dashboard
   */
  clearCache(): void {
    this.cachedDashboardData = null;
    this.cachedRankingsData = null;
    this.cacheTimestamp = 0;
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
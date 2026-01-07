import { catchError, Observable, of, throwError } from "rxjs";
import { 
  CommunityComparison, 
  DashboardStats, 
  LevelComparison, 
  LevelProgress, 
  LevelStatsMap, 
  PersonalStats, 
  RankingItem, 
  RankingsResponse, 
  TimeStats 
} from "../models/user-dashboard.model";
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  private readonly baseUrl = 'http://localhost:8080/api/dashboard';
  
  private cachedDashboardData: DashboardStats | null = null;
  private cachedRankingsData: RankingsResponse | null = null;
  private dashboardCacheTimestamp: number = 0;
  private rankingsCacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene solo las estadísticas del usuario (sin comparativas)
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`).pipe(
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
   * Obtiene datos del dashboard con caché
   */
  getDashboardWithCache(forceRefresh: boolean = false): Observable<DashboardStats> {
    const now = Date.now();
    
    if (!forceRefresh && 
        this.cachedDashboardData && 
        (now - this.dashboardCacheTimestamp) < this.CACHE_DURATION) {
      return of(this.cachedDashboardData);
    }

    return new Observable(observer => {
      this.getDashboardStats().subscribe({
        next: (data) => {
          this.cachedDashboardData = data;
          this.dashboardCacheTimestamp = now;
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Obtiene rankings con caché
   */
  getRankingsWithCache(limit: number = 5, forceRefresh: boolean = false): Observable<RankingsResponse> {
    const now = Date.now();
    
    if (!forceRefresh && 
        this.cachedRankingsData && 
        (now - this.rankingsCacheTimestamp) < this.CACHE_DURATION) {
      return of(this.cachedRankingsData);
    }

    return new Observable(observer => {
      this.getRankings(limit).subscribe({
        next: (data) => {
          this.cachedRankingsData = data;
          this.rankingsCacheTimestamp = now;
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Obtiene estadísticas de tiempo formateadas
   */
  getFormattedTimeStats(personalStats: PersonalStats): TimeStats {
    if (!personalStats) {
      return {
        average_time_per_question: '0s',
        average_time_first_attempt: '0s',
        total_time_invested: '0s',
        efficiency_score_first_attempt: 0,
        efficiency_score_all_attempts: 0
      };
    }
    
    return {
      average_time_per_question: this.formatTimeSince(personalStats.average_time_taken_per_question_all_attempts),
      average_time_first_attempt: this.formatTimeSince(personalStats.average_time_taken_per_question_first_attempt),
      total_time_invested: this.formatTimeSince(personalStats.total_time_taken_all_attempts),
      efficiency_score_first_attempt: this.calculateEfficiencyScoreFirstAttempt(personalStats),
      efficiency_score_all_attempts: this.calculateEfficiencyScoreAllAttempts(personalStats)
    };
  }

  /**
   * Calcula las posiciones del usuario en los rankings
   */
  getUserRankingPositions(rankingsResponse: RankingsResponse): any[] {
    if (!rankingsResponse?.current_user?.position) return [];

    const positions = [];
    const position = rankingsResponse.current_user.position;
    const totalActiveUsers = rankingsResponse.current_user.position.total_active_users || 1;

    // Tests Completados
    if (position.completed_tests > 0) {
      positions.push({
        category: 'Tests Completados',
        position: position.completed_tests,
        total_active_users: totalActiveUsers,
        percentile: this.calculatePercentile(position.completed_tests, totalActiveUsers, false),
        icon: '📊'
      });
    }

    // Tiempo Promedio (Todos los intentos)
    if (position.avg_time_per_question_all_attempts > 0) {
      positions.push({
        category: 'Tiempo Promedio',
        position: position.avg_time_per_question_all_attempts,
        total_active_users: totalActiveUsers,
        percentile: this.calculatePercentile(position.avg_time_per_question_all_attempts, totalActiveUsers, false),
        icon: '⏱️'
      });
    }

    // Tiempo 1er Intento
    if (position.avg_time_per_question_first_attempt > 0) {
      positions.push({
        category: 'Tiempo 1er Intento',
        position: position.avg_time_per_question_first_attempt,
        total_active_users: totalActiveUsers,
        percentile: this.calculatePercentile(position.avg_time_per_question_first_attempt, totalActiveUsers, false),
        icon: '🚀'
      });
    }

    // Precisión General
    if (position.accuracy_all_attempts > 0) {
      positions.push({
        category: 'Precisión General',
        position: position.accuracy_all_attempts,
        total_active_users: totalActiveUsers,
        percentile: this.calculatePercentile(position.accuracy_all_attempts, totalActiveUsers),
        icon: '🎯'
      });
    }

    // Precisión 1er Intento
    if (position.accuracy_first_attempt > 0) {
      positions.push({
        category: 'Precisión 1er Intento',
        position: position.accuracy_first_attempt,
        total_active_users: totalActiveUsers,
        percentile: this.calculatePercentile(position.accuracy_first_attempt, totalActiveUsers),
        icon: '⭐'
      });
    }

    return positions;
  }

  /**
   * Calcula estadísticas comparativas con la comunidad
   */
  getCommunityComparison(personalStats: PersonalStats, rankingsResponse: RankingsResponse): CommunityComparison | null {
    if (!personalStats || !rankingsResponse?.community_averages) return null;

    const community = rankingsResponse.community_averages;
    const userTimeAll = personalStats.average_time_taken_per_question_all_attempts;
    const userTimeFirst = personalStats.average_time_taken_per_question_first_attempt;
    
    const userAccuracyAll = personalStats.average_score_all_attempts;
    const userAccuracyFirst = personalStats.average_score_first_attempt;

    return {
      time_all_improvement: this.calculateImprovement(
        userTimeAll,
        community.avg_time_per_question_all_attempts,
        false // menor es mejor para tiempo
      ),
      time_first_improvement: this.calculateImprovement(
        userTimeFirst,
        community.avg_time_per_question_first_attempt,
        false
      ),
      accuracy_all_improvement: this.calculateImprovement(
        userAccuracyAll,
        community.accuracy_all_attempts,
        true // mayor es mejor para precisión
      ),
      accuracy_first_improvement: this.calculateImprovement(
        userAccuracyFirst,
        community.accuracy_first_attempt,
        true
      ),
      questions_per_user_improvement: this.calculateImprovement(
        personalStats.total_questions_answered,
        community.avg_questions_per_user,
        true
      ),
      community_avg_time_all_attempts: community.avg_time_per_question_all_attempts,
      community_avg_time_first_attempt: community.avg_time_per_question_first_attempt,
      community_avg_accuracy_all_attempts: community.accuracy_all_attempts,
      community_avg_accuracy_first_attempt: community.accuracy_first_attempt,
      community_avg_questions_per_user: community.avg_questions_per_user
    };
  }

  /**
   * Calcula comparativas por nivel
   */
  getLevelComparisons(levelStats: LevelStatsMap, communityLevelStats: any): LevelComparison | null {
    if (!levelStats || !communityLevelStats) return null;

    const comparisons: LevelComparison = {};
    
    Object.keys(levelStats).forEach(level => {
      const userStats = levelStats[level];
      const communityStats = communityLevelStats[level];
      
      if (userStats && communityStats) {
        comparisons[level] = {
          time_improvement: this.calculateImprovement(
            userStats.all_attempts.average_time_taken_per_question,
            communityStats.avg_time_per_question_all,
            false
          ),
          accuracy_improvement: this.calculateImprovement(
            userStats.all_attempts.average_score,
            communityStats.avg_accuracy_all,
            true
          ),
          time_first_improvement: this.calculateImprovement(
            userStats.first_attempt.average_time_taken_per_question,
            communityStats.avg_time_per_question_first,
            false
          ),
          accuracy_first_improvement: this.calculateImprovement(
            userStats.first_attempt.average_score,
            communityStats.avg_accuracy_first,
            true
          ),
          tests_improvement: this.calculateImprovement(
            userStats.all_attempts.tests_count,
            communityStats.avg_tests_per_user || 0,
            true
          ),
          questions_improvement: this.calculateImprovement(
            userStats.all_attempts.questions_count,
            communityStats.avg_questions_per_user || 0,
            true
          ),
          community_avg_time: communityStats.avg_time_per_question_all,
          community_avg_accuracy: communityStats.avg_accuracy_all,
          community_avg_time_first_attempt: communityStats.avg_time_per_question_first,
          community_avg_accuracy_first_attempt: communityStats.avg_accuracy_first,
          community_avg_tests: communityStats.avg_tests_per_user || 0,
          community_avg_questions: communityStats.avg_questions_per_user || 0,
          total_users: communityStats.total_users_with_level || 0
        };
      }
    });

    return comparisons;
  }

  /**
   * Obtiene estadísticas de progreso por nivel
   */
  getLevelProgress(levelStats: LevelStatsMap, personalStats: PersonalStats): LevelProgress[] {
    if (!levelStats || !personalStats) return [];
    
    const progress: LevelProgress[] = [];
    const totalLevelTests = 50; // Esto debería ser configurable o venir de los datos
    
    Object.keys(levelStats).forEach(level => {
      const stats = levelStats[level];
      const levelTests = stats.all_attempts.tests_count;
      
      const accuracy = stats.all_attempts.average_score;
      const avgTime = stats.all_attempts.average_time_taken_per_question;
      const completionPercentage = totalLevelTests > 0 ? (levelTests / totalLevelTests) * 100 : 0;
      
      progress.push({
        level,
        completed_tests: levelTests,
        total_tests: totalLevelTests,
        completion_percentage: completionPercentage,
        accuracy,
        average_time: avgTime,
      });
    });
    
    return progress.sort((a, b) => 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(a.level) - 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(b.level)
    );
  }

  /**
   * Obtiene estadísticas detalladas por nivel para UI
   */
  getLevelDetails(levelStats: LevelStatsMap): any[] {
    if (!levelStats) return [];
    
    return Object.keys(levelStats).map(level => {
      const stats = levelStats[level];
      const firstAttempt = stats.first_attempt;
      const allAttempts = stats.all_attempts;
      
      return {
        level,
        first_attempt: {
          tests: firstAttempt.tests_count,
          questions: firstAttempt.questions_count,
          accuracy: firstAttempt.average_score,
          time: firstAttempt.average_time_taken_per_question,
          correct: firstAttempt.total_correct,
          incorrect: firstAttempt.total_wrong
        },
        all_attempts: {
          tests: allAttempts.tests_count,
          questions: allAttempts.questions_count,
          accuracy: allAttempts.average_score,
          time: allAttempts.average_time_taken_per_question,
          correct: allAttempts.total_correct,
          incorrect: allAttempts.total_wrong
        },
        improvement_rate: {
          accuracy: allAttempts.average_score - firstAttempt.average_score,
          time: allAttempts.average_time_taken_per_question - firstAttempt.average_time_taken_per_question,
          questions: allAttempts.questions_count - firstAttempt.questions_count
        }
      };
    });
  }

  /**
   * Obtiene información de ranking por nivel del usuario
   */
  getLevelRankingInfo(rankingsResponse: RankingsResponse): any[] {
    if (!rankingsResponse?.current_user?.position?.accuracy_by_level_first) return [];
    
    const levelPositions = rankingsResponse.current_user.position.accuracy_by_level_first;
    const levelKeys = Object.keys(levelPositions);
    
    return levelKeys.map(level => {
      const pos = levelPositions[level];
      const totalActiveUsers = rankingsResponse.current_user?.position.total_active_users || 1;
      const percentile = totalActiveUsers > 0 
        ? Math.round(((totalActiveUsers - pos + 1) / totalActiveUsers) * 100)
        : 0;
      
      return {
        level,
        accuracy_position: pos,
        total_users: totalActiveUsers,
        percentile
      };
    }).sort((a, b) => 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(a.level) - 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(b.level)
    );
  }

  /**
   * Obtiene comparativas de nivel vs comunidad
   */
  getLevelCommunityComparison(levelStats: LevelStatsMap, rankingsResponse: RankingsResponse): any[] {
    if (!levelStats || !rankingsResponse?.community_averages?.levels) return [];
    
    const communityLevels = rankingsResponse.community_averages.levels;
    
    return Object.keys(levelStats).map(level => {
      const userStats = levelStats[level];
      const communityStats = communityLevels[level];
      
      if (!userStats || !communityStats) return null;
      
      const allAttempts = userStats.all_attempts;
      const firstAttempt = userStats.first_attempt;
      
      return {
        level,
        comparisons: {
          accuracy_all: {
            user: allAttempts.average_score,
            community: communityStats.avg_accuracy_all_attempts,
            improvement: this.calculateImprovement(
              allAttempts.average_score,
              communityStats.avg_accuracy_all_attempts,
              true
            ),
            is_better: allAttempts.average_score > communityStats.avg_accuracy_all_attempts
          },
          time_all: {
            user: allAttempts.average_time_taken_per_question,
            community: communityStats.avg_time_per_question_all_attempts,
            improvement: this.calculateImprovement(
              allAttempts.average_time_taken_per_question,
              communityStats.avg_time_per_question_all_attempts,
              false
            ),
            is_better: allAttempts.average_time_taken_per_question < communityStats.avg_time_per_question_all_attempts
          },
          accuracy_first: {
            user: firstAttempt.average_score,
            community: communityStats.avg_accuracy_first_attempt,
            improvement: this.calculateImprovement(
              firstAttempt.average_score,
              communityStats.avg_accuracy_first_attempt,
              true
            ),
            is_better: firstAttempt.average_score > communityStats.avg_accuracy_first_attempt
          },
          time_first: {
            user: firstAttempt.average_time_taken_per_question,
            community: communityStats.avg_time_per_question_first_attempt,
            improvement: this.calculateImprovement(
              firstAttempt.average_time_taken_per_question,
              communityStats.avg_time_per_question_first_attempt,
              false
            ),
            is_better: firstAttempt.average_time_taken_per_question < communityStats.avg_time_per_question_first_attempt
          }
        }
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Obtiene los rankings por tipo
   */
  getRankingByType(rankingsResponse: RankingsResponse, type: string): RankingItem[] {
    if (!rankingsResponse) return [];
    
    switch(type) {
      case 'tests': return rankingsResponse.top_by_tests || [];
      case 'time_all': return rankingsResponse.top_by_avg_time_per_question_all_attempts || [];
      case 'time_first': return rankingsResponse.top_by_avg_time_per_question_first_attempt || [];
      case 'accuracy_all': return rankingsResponse.top_by_accuracy_all_attempts || [];
      case 'accuracy_first': return rankingsResponse.top_by_accuracy_first_attempt || [];
      case 'questions': return rankingsResponse.top_by_questions_answered || [];
      default: return [];
    }
  }

  /**
   * Obtiene rankings por nivel
   */
  getRankingsByLevel(rankingsResponse: RankingsResponse, level: string): RankingItem[] {
    if (!rankingsResponse?.top_by_levels) return [];
    return rankingsResponse.top_by_levels[level] || [];
  }

  /**
   * Obtiene rankings por nivel Acurracy
   */
  getRankingsByLevelAccuracy(rankingsResponse: RankingsResponse, level: string): RankingItem[] {
    if (!rankingsResponse?.top_by_levels_accuracy) return [];
    return rankingsResponse.top_by_levels_accuracy[level] || [];
  }

  /**
   * Obtiene distribución de tests por nivel
   */
  getLevelDistribution(levelStats: LevelStatsMap, totalTests: number): any[] {
    if (!levelStats || totalTests === 0) return [];
    
    return Object.keys(levelStats).map(level => {
      const levelTests = levelStats[level].first_attempt.tests_count;
      return {
        level,
        tests: levelTests,
        percentage: (levelTests / totalTests) * 100,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Helper: Calcula percentil
   */
  private calculatePercentile(position: number, total: number, higherIsBetter: boolean = true): number {
    if (total === 0 || position === 0) return 0;
    
    if (higherIsBetter) {
      // Para puntuaciones donde mayor es mejor (precisión, tests)
      return Math.round(((total - position + 1) / total) * 100);
    } else {
      // Para tiempo donde menor es mejor
      return Math.round((position / total) * 100);
    }
  }

  /**
   * Helper: Calcula porcentaje de mejora
   */
  private calculateImprovement(userValue: number, communityValue: number, higherIsBetter: boolean): number {
    if (!communityValue || communityValue === 0) return 0;
    
    if (higherIsBetter) {
      return ((userValue - communityValue) / communityValue) * 100;
    } else {
      return ((communityValue - userValue) / communityValue) * 100;
    }
  }

  /**
   * Helper: Calcula score de eficiencia
   */
  private calculateEfficiencyScoreFirstAttempt(personalStats: PersonalStats): number {
    if (personalStats.completed_tests_first_attempt === 0) return 0;
    
    const accuracy = personalStats.average_score_first_attempt;
    const avgTime = personalStats.average_time_taken_per_question_first_attempt;
    
    // Puntuación basada en precisión (70%) y tiempo (30%)
    const timeScore = avgTime > 0 ? Math.min(100, (300 / avgTime) * 100) : 0;
    const accuracyScore = accuracy || 0;
    
    return Math.round((accuracyScore * 0.7) + (timeScore * 0.3));
  }


  private calculateEfficiencyScoreAllAttempts(personalStats: PersonalStats): number {
    if (personalStats.completed_tests_all_attempts === 0) return 0;
    
    const accuracy = personalStats.average_score_all_attempts;
    const avgTime = personalStats.average_time_taken_per_question_all_attempts;
    
    // Puntuación basada en precisión (70%) y tiempo (30%)
    const timeScore = avgTime > 0 ? Math.min(100, (300 / avgTime) * 100) : 0;
    const accuracyScore = accuracy || 0;
    
    return Math.round((accuracyScore * 0.7) + (timeScore * 0.3));
  }

  /**
   * Calcula el nivel global del usuario basado en sus estadísticas
   */
  calculateUserLevel(personalStats: PersonalStats, levelStats: LevelStatsMap): string {
    if (!personalStats || !levelStats) return 'Principiante';
    
    let totalWeightedAccuracy = 0;
    let totalTests = 0;
    
    Object.keys(levelStats).forEach(level => {
      const stats = levelStats[level];
      const levelTests = stats.all_attempts.tests_count;
      const levelAccuracy = stats.all_attempts.average_score;
      
      totalWeightedAccuracy += levelAccuracy * levelTests;
      totalTests += levelTests;
    });
    
    const averageAccuracy = totalTests > 0 ? totalWeightedAccuracy / totalTests : 0;
    return this.getLevelByAccuracy(averageAccuracy);
  }

  /**
   * Obtiene el nombre del nivel basado en el porcentaje de precisión
   */
  private getLevelByAccuracy(accuracy: number): string {
    if (accuracy >= 80) return 'Avanzado';
    if (accuracy >= 60) return 'Intermedio';
    return 'Principiante';
  }

  /**
   * Limpia toda la caché
   */
  clearCache(): void {
    this.cachedDashboardData = null;
    this.cachedRankingsData = null;
    this.dashboardCacheTimestamp = 0;
    this.rankingsCacheTimestamp = 0;
  }

  /**
   * Obtiene tiempo desde última actualización del dashboard
   */
  getTimeSinceDashboardUpdate(): string {
    if (!this.dashboardCacheTimestamp) return 'Nunca';
    return this.formatTimeSince(Date.now() - this.dashboardCacheTimestamp);
  }

  /**
   * Obtiene tiempo desde última actualización de rankings
   */
  getTimeSinceRankingsUpdate(): string {
    if (!this.rankingsCacheTimestamp) return 'Nunca';
    return this.formatTimeSince(Date.now() - this.rankingsCacheTimestamp);
  }

  /**
   * Helper: Formatea tiempo desde timestamp (en milisegundos)
   */
  private formatTimeSince(timestampMs: number): string {
    const seconds = Math.floor(timestampMs / 1000);
    
    if (seconds < 60) return 'Hace unos segundos';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
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
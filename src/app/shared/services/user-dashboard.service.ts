import { catchError, Observable, of, throwError } from "rxjs";
import { 
  AttemptStatsCategory,
  CommunityAveragesResponse,
  CommunityComparison, 
  DashboardStats, 
  LevelComparison, 
  LevelProgress, 
  LEVELS, 
  LevelStatsMap, 
  PersonalStats, 
  RankingItem, 
  RankingPosition, 
  RankingsResponse, 
  TimeStats, 
  UserPosition
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
  return {
    average_time_per_question: `${personalStats.all_attempts.average_time_taken_per_question.toFixed(1)}s`,
    average_time_first_attempt: `${personalStats.first_attempt.average_time_taken_per_question.toFixed(1)}s`,
    total_time_invested: this.formatTimeSince(personalStats.all_attempts.total_time_taken),
    efficiency_score_first_attempt: this.calculateEfficiencyScore(personalStats.first_attempt),
    efficiency_score_all_attempts: this.calculateEfficiencyScore(personalStats.all_attempts)
  };
}


  /**
   * Helper para obtener estadísticas de ranking desde la nueva estructura
   */
  getUserRankingPositions(
    userPosition: UserPosition,
  ): RankingPosition[] {
    const positions: RankingPosition[] = [];
    const totalActiveUsers = userPosition.total_active_users || 0;
    // Tests completados
    positions.push({
      category: 'Tests Completados',
      position: userPosition.completed_tests,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.completed_tests, totalActiveUsers),
      formatted_value: `#${userPosition.completed_tests}`,
      value: userPosition.completed_tests,
      icon: '📊'
    });
    
    // Tiempo promedio (all attempts)
    positions.push({
      category: 'Tiempo Promedio',
      position: userPosition.all_attempts.avg_time_taken_per_question,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.all_attempts.avg_time_taken_per_question, totalActiveUsers, true),
      formatted_value: `#${userPosition.all_attempts.avg_time_taken_per_question}`,
      value: userPosition.all_attempts.avg_time_taken_per_question,
      icon: '⏱️'
    });
    
    // Precisión (all attempts)
    positions.push({
      category: 'Precisión General',
      position: userPosition.all_attempts.accuracy,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.all_attempts.accuracy, totalActiveUsers),
      formatted_value: `#${userPosition.all_attempts.accuracy}`,
      value: userPosition.all_attempts.accuracy,
      icon: '🎯'
    });
    
    // Tiempo promedio (first attempt)
    positions.push({
      category: 'Tiempo 1er Intento',
      position: userPosition.first_attempt.avg_time_taken_per_question,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.first_attempt.avg_time_taken_per_question, totalActiveUsers, true),
      formatted_value: `#${userPosition.first_attempt.avg_time_taken_per_question}`,
      value: userPosition.first_attempt.avg_time_taken_per_question,
      icon: '🚀'
    });
    
    // Precisión (first attempt)
    positions.push({
      category: 'Precisión 1er Intento',
      position: userPosition.first_attempt.accuracy,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.first_attempt.accuracy, totalActiveUsers),
      formatted_value: `#${userPosition.first_attempt.accuracy}`,
      value: userPosition.first_attempt.accuracy,
      icon: '⭐'
    });
    
    // Preguntas respondidas
    positions.push({
      category: 'Preguntas Respondidas',
      position: userPosition.all_attempts.questions_answered,
      total_participants: totalActiveUsers,
      percentile: this.calculatePercentile(userPosition.all_attempts.questions_answered, totalActiveUsers),
      formatted_value: `#${userPosition.all_attempts.questions_answered}`,
      value: userPosition.all_attempts.questions_answered,
      icon: '❓'
    });
    
    return positions;
  }

  
  /**
   * Calcula estadísticas comparativas con la comunidad
   */
  getCommunityComparison(
    personalStats: PersonalStats,
    communityAverages: CommunityAveragesResponse
  ): CommunityComparison {
    const userAllTime = personalStats.all_attempts.average_time_taken_per_question;
    const userFirstTime = personalStats.first_attempt.average_time_taken_per_question;
    
    const allTotal = personalStats.all_attempts.total_correct + personalStats.all_attempts.total_wrong;
    const firstTotal = personalStats.first_attempt.total_correct + personalStats.first_attempt.total_wrong;
    
    const userAllAccuracy = allTotal > 0 ? 
      (personalStats.all_attempts.total_correct / allTotal) * 100 : 0;
    const userFirstAccuracy = firstTotal > 0 ? 
      (personalStats.first_attempt.total_correct / firstTotal) * 100 : 0;
    
    return {
      time_all_improvement: this.calculateImprovementPercentage(
        userAllTime, 
        communityAverages.all_attempts.avg_time_taken_per_question, 
        true
      ),
      time_first_improvement: this.calculateImprovementPercentage(
        userFirstTime, 
        communityAverages.first_attempt.avg_time_taken_per_question, 
        true
      ),
      accuracy_all_improvement: this.calculateImprovementPercentage(
        userAllAccuracy, 
        communityAverages.all_attempts.avg_accuracy,
        false
      ),
      accuracy_first_improvement: this.calculateImprovementPercentage(
        userFirstAccuracy, 
        communityAverages.first_attempt.avg_accuracy,
        false
      ),
      questions_per_user_improvement: this.calculateImprovementPercentage(
        personalStats.all_attempts.total_questions_answered,
        communityAverages.all_attempts.avg_questions_per_user,
        false
      ),
      community_avg_time_all_attempts: communityAverages.all_attempts.avg_time_taken_per_question,
      community_avg_time_first_attempt: communityAverages.first_attempt.avg_time_taken_per_question,
      community_avg_accuracy_all_attempts: communityAverages.all_attempts.avg_accuracy,
      community_avg_accuracy_first_attempt: communityAverages.first_attempt.avg_accuracy,
      community_avg_questions_per_user: communityAverages.all_attempts.avg_questions_per_user
    };
  }
  
  /**
   * Helper para obtener comparaciones por nivel
   */
  getLevelComparisons(
    levelStats: LevelStatsMap,
    userPosition: UserPosition,
    communityAverages: CommunityAveragesResponse
  ): LevelComparison {
    const comparisons: LevelComparison = {};
    
    LEVELS.forEach(level => {
      const userStats = levelStats[level];
      const communityLevel = communityAverages.levels[level];
      
      if (userStats && communityLevel) {
        comparisons[level] = {
          time_improvement: this.calculateImprovementPercentage(
            userStats.all_attempts.average_time_taken_per_question,
            communityLevel.all_attempts.avg_time_taken_per_question,
            true
          ),
          accuracy_improvement: this.calculateImprovementPercentage(
            userStats.all_attempts.average_score,
            communityLevel.all_attempts.avg_accuracy,
            false
          ),
          time_first_improvement: this.calculateImprovementPercentage(
            userStats.first_attempt.average_time_taken_per_question,
            communityLevel.first_attempt.avg_time_taken_per_question,
            true
          ),
          accuracy_first_improvement: this.calculateImprovementPercentage(
            userStats.first_attempt.average_score,
            communityLevel.first_attempt.avg_accuracy,
            false
          ),
          tests_improvement: this.calculateImprovementPercentage(
            userStats.all_attempts.tests_count,
            communityLevel.all_attempts.avg_questions_per_user, // Usamos avg_questions_per_user como proxy para tests
            false
          ),
          questions_improvement: this.calculateImprovementPercentage(
            userStats.all_attempts.questions_count,
            communityLevel.all_attempts.avg_questions_per_user,
            false
          ),
          community_avg_time: communityLevel.all_attempts.avg_time_taken_per_question,
          community_avg_accuracy: communityLevel.all_attempts.avg_accuracy,
          community_avg_time_first_attempt: communityLevel.first_attempt.avg_time_taken_per_question,
          community_avg_accuracy_first_attempt: communityLevel.first_attempt.avg_accuracy,
          community_avg_tests: communityLevel.all_attempts.avg_questions_per_user,
          community_avg_questions: communityLevel.all_attempts.avg_questions_per_user,
          total_users: userPosition.total_active_users
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
    if (!rankingsResponse?.current_user_position.levels) return [];
    
    const levelPositions = rankingsResponse.current_user_position.levels;
    const levelKeys = Object.keys(levelPositions);
    
    return levelKeys.map(level => {
      const pos = levelPositions[level].first_attempt;
      const totalActiveUsers = rankingsResponse.current_user_position.total_active_users || 1;
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
            community: communityStats.all_attempts.avg_accuracy,
            improvement: this.calculateImprovementPercentage(
              allAttempts.average_score,
              communityStats.all_attempts.avg_accuracy,
              true
            ),
            is_better: allAttempts.average_score > communityStats.all_attempts.avg_accuracy
          },
          time_all: {
            user: allAttempts.average_time_taken_per_question,
            community: communityStats.all_attempts.avg_time_taken_per_question,
            improvement: this.calculateImprovementPercentage(
              allAttempts.average_time_taken_per_question,
              communityStats.all_attempts.avg_time_taken_per_question,
              false
            ),
            is_better: allAttempts.average_time_taken_per_question < communityStats.all_attempts.avg_time_taken_per_question
          },
          accuracy_first: {
            user: firstAttempt.average_score,
            community: communityStats.first_attempt.avg_accuracy,
            improvement: this.calculateImprovementPercentage(
              firstAttempt.average_score,
              communityStats.first_attempt.avg_accuracy,
              true
            ),
            is_better: firstAttempt.average_score > communityStats.first_attempt.avg_accuracy
          },
          time_first: {
            user: firstAttempt.average_time_taken_per_question,
            community: communityStats.first_attempt.avg_time_taken_per_question,
            improvement: this.calculateImprovementPercentage(
              firstAttempt.average_time_taken_per_question,
              communityStats.first_attempt.avg_time_taken_per_question,
              false
            ),
            is_better: firstAttempt.average_time_taken_per_question < communityStats.first_attempt.avg_time_taken_per_question
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
      case 'time_all': return rankingsResponse.top_by_avg_time_taken_per_question.all_attempts || [];
      case 'time_first': return rankingsResponse.top_by_avg_time_taken_per_question.first_attempt || [];
      case 'accuracy_all': return rankingsResponse.top_by_accuracy.all_attempts || [];
      case 'accuracy_first': return rankingsResponse.top_by_accuracy.first_attempt || [];
      case 'questions_all': return rankingsResponse.top_by_questions_answered.all_attempts || [];
      case 'questions_first': return rankingsResponse.top_by_questions_answered.first_attempt || [];
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
  private calculateImprovementPercentage(userValue: number, communityValue: number, higherIsBetter: boolean): number {
    if (!communityValue || communityValue === 0) return 0;
    
    if (higherIsBetter) {
      return ((userValue - communityValue) / communityValue) * 100;
    } else {
      return ((communityValue - userValue) / communityValue) * 100;
    }
  }


  /**
   * Helper para calcular puntuación de eficiencia
   */
  calculateEfficiencyScore(stats: AttemptStatsCategory): number {
    const timeScore = stats.average_time_taken_per_question > 0 ? 
      100 / (1 + Math.log(stats.average_time_taken_per_question)) : 0;
    const accuracyScore = stats.average_score;
    return (timeScore * 0.4 + accuracyScore * 0.6);
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
    const hours = Math.floor(timestampMs / 3600);
    const minutes = Math.floor((timestampMs % 3600) / 60);
    const secs = timestampMs % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
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
import { catchError, Observable, of, throwError } from "rxjs";
import { AccuracyStats, CommunityComparison, DashboardStats, LevelComparison, LevelProgress, LevelStatsMap, PersonalStats, RankingItem, RankingsResponse, TimeStats } from "../models/user-dashboard.model";
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  
  // URLs según la nueva estructura
  private readonly baseUrl = 'http://localhost:8080/api/dashboard'; // Ajusta según tu backend
  
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
      average_time_per_question: this.formatTimeSince(personalStats.average_time_per_question),
      average_time_first_attempt: this.formatTimeSince(personalStats.average_time_per_question_first_attempt),
      total_time_invested: this.formatTimeSince(personalStats.total_time),
      efficiency_score: this.calculateEfficiencyScore(personalStats)
    };
  }

  /**
   * Obtiene estadísticas de precisión detalladas
   */
  getAccuracyStats(personalStats: PersonalStats): AccuracyStats {
    const totalCorrectAll = personalStats.total_correct.all_attempts;
    const totalIncorrectAll = personalStats.total_incorrect.all_attempts;
    const totalAnswers = totalCorrectAll + totalIncorrectAll;
    const accuracy = totalAnswers > 0 
      ? (totalCorrectAll / totalAnswers) * 100 
      : 0;

    const firstAttemptTotal = personalStats.total_questions_first_attempt;
    const firstAttemptCorrect = personalStats.total_correct.first_attempt;
    const firstAttemptIncorrect = personalStats.total_incorrect.first_attempt;
    const firstAttemptAccuracy = firstAttemptTotal > 0 
      ? (firstAttemptCorrect / firstAttemptTotal) * 100 
      : 0;

    return {
      accuracy_percentage: accuracy,
      total_answers: totalAnswers,
      correct_answers: totalCorrectAll,
      incorrect_answers: totalIncorrectAll,
      first_attempt_accuracy: firstAttemptAccuracy,
      first_attempt_correct: firstAttemptCorrect,
      first_attempt_incorrect: firstAttemptIncorrect,
      first_attempt_total: firstAttemptTotal
    };
  }

  /**
   * Calcula las posiciones del usuario en los rankings - ACTUALIZADO
   */
  getRankingPositions(rankingsResponse: RankingsResponse): any[] {
    if (!rankingsResponse?.current_user?.position) return [];

    const positions = [];
    const position = rankingsResponse.current_user.position;
    const totalActiveUsers = rankingsResponse.current_user.position.total_active_users || 1;

    // Tests Completados
    if (position.tests > 0) {
      positions.push({
        category: 'Tests Completados',
        position: position.tests,
        total_active_users: totalActiveUsers,
        formatted_value: `#${position.tests} de ${totalActiveUsers}`,
        icon: '📊'
      });
    }

    // Tiempo Promedio (Todos los intentos)
    if (position.avg_time_per_question_all > 0) {
      positions.push({
        category: 'Tiempo Promedio',
        position: position.avg_time_per_question_all,
        total_participants: totalActiveUsers,
        percentile: this.calculatePercentile(position.avg_time_per_question_all, totalActiveUsers, false),
        formatted_value: `#${position.avg_time_per_question_all} de ${totalActiveUsers}`,
        icon: '⏱️'
      });
    }

    // Tiempo 1er Intento
    if (position.avg_time_per_question_first > 0) {
      positions.push({
        category: 'Tiempo 1er Intento',
        position: position.avg_time_per_question_first,
        total_participants: totalActiveUsers,
        percentile: this.calculatePercentile(position.avg_time_per_question_first, totalActiveUsers, false),
        formatted_value: `#${position.avg_time_per_question_first} de ${totalActiveUsers}`,
        icon: '🚀'
      });
    }

    // Precisión General
    if (position.accuracy_all > 0) {
      positions.push({
        category: 'Precisión General',
        position: position.accuracy_all,
        total_participants: totalActiveUsers,
        percentile: this.calculatePercentile(position.accuracy_all, totalActiveUsers),
        formatted_value: `#${position.accuracy_all} de ${totalActiveUsers}`,
        icon: '🎯'
      });
    }

    // Precisión 1er Intento
    if (position.accuracy_first > 0) {
      positions.push({
        category: 'Precisión 1er Intento',
        position: position.accuracy_first,
        total_participants: totalActiveUsers,
        percentile: this.calculatePercentile(position.accuracy_first, totalActiveUsers),
        formatted_value: `#${position.accuracy_first} de ${totalActiveUsers}`,
        icon: '⭐'
      });
    }

    return positions;
  }

  /**
   * Calcula estadísticas comparativas con la comunidad - ACTUALIZADO
   */
  getCommunityComparison(personalStats: PersonalStats, rankingsResponse: RankingsResponse): CommunityComparison | null {
    if (!personalStats || !rankingsResponse?.community_averages) return null;

    const community = rankingsResponse.community_averages;
    const userTimeAll = personalStats.average_time_per_question;
    const userTimeFirst = personalStats.average_time_per_question_first_attempt;
    
    // Calcular precisión del usuario
    const userAccuracyAll = personalStats.average_score;
    const userAccuracyFirst = personalStats.average_score_first_attempt;

    return {
      time_all_improvement: this.calculateImprovement(
        userTimeAll,
        community.avg_time_per_question_all,
        false // menor es mejor para tiempo
      ),
      time_first_improvement: this.calculateImprovement(
        userTimeFirst,
        community.avg_time_per_question_first,
        false
      ),
      accuracy_all_improvement: this.calculateImprovement(
        userAccuracyAll,
        community.accuracy_all,
        true // mayor es mejor para precisión
      ),
      accuracy_first_improvement: this.calculateImprovement(
        userAccuracyFirst,
        community.accuracy_first,
        true
      ),
      questions_per_user_improvement: this.calculateImprovement(
        personalStats.total_questions_answered,
        community.avg_questions_per_user,
        true
      ),
      community_avg_time_all: community.avg_time_per_question_all,
      community_avg_time_first: community.avg_time_per_question_first,
      community_avg_accuracy_all: community.accuracy_all,
      community_avg_accuracy_first: community.accuracy_first,
      community_avg_questions_per_user: community.avg_questions_per_user
    };
  }

  /**
   * Calcula comparativas por nivel - NUEVO MÉTODO PARA TU ESTRUCTURA
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
            userStats.all_attempts.average_time_per_question,
            communityStats.avg_time_per_question_all,
            false
          ),
          accuracy_improvement: this.calculateImprovement(
            userStats.all_attempts.average_score,
            communityStats.avg_accuracy_all,
            true
          ),
          time_first_improvement: this.calculateImprovement(
            userStats.first_attempt.average_time_per_question,
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
          community_avg_time_first: communityStats.avg_time_per_question_first,
          community_avg_accuracy_first: communityStats.avg_accuracy_first,
          community_avg_tests: communityStats.avg_tests_per_user || 0,
          community_avg_questions: communityStats.avg_questions_per_user || 0,
          total_users: communityStats.total_users_with_level || 0
        };
      }
    });

    return comparisons;
  }

  /**
   * Obtiene estadísticas de progreso por nivel - ACTUALIZADO
   */
  getLevelProgress(levelStats: LevelStatsMap, personalStats: PersonalStats): LevelProgress[] {
    if (!levelStats || !personalStats) return [];
    
    const progress: LevelProgress[] = [];
    
    Object.keys(levelStats).forEach(level => {
      const stats = levelStats[level];
      const levelTests = stats.all_attempts.tests_count;
      const totalLevelTests = 50; // Puedes ajustar esto según tu lógica de negocio
      
      const accuracy = stats.all_attempts.average_score;
      const avgTime = stats.all_attempts.average_time_per_question;
      const completionPercentage = totalLevelTests > 0 ? (levelTests / totalLevelTests) * 100 : 0;
      
      progress.push({
        level,
        tests_completed: levelTests,
        total_tests: totalLevelTests,
        completion_percentage: completionPercentage,
        accuracy,
        average_time: avgTime,
        color: this.getLevelColor(level),
        icon: this.getLevelIcon(level)
      });
    });
    
    return progress.sort((a, b) => 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(a.level) - 
      ['Principiante', 'Intermedio', 'Avanzado'].indexOf(b.level)
    );
  }

  /**
   * Obtiene estadísticas detalladas por nivel para UI - ACTUALIZADO
   */
  getLevelDetails(levelStats: LevelStatsMap): any[] {
    if (!levelStats) return [];
    
    return Object.keys(levelStats).map(level => {
      const stats = levelStats[level];
      const firstAttempt = stats.first_attempt;
      const allAttempts = stats.all_attempts;
      
      return {
        level,
        color: this.getLevelColor(level),
        icon: this.getLevelIcon(level),
        first_attempt: {
          tests: firstAttempt.tests_count,
          questions: firstAttempt.questions_count,
          accuracy: firstAttempt.average_score,
          time: firstAttempt.average_time_per_question,
          correct: firstAttempt.total_correct,
          incorrect: firstAttempt.total_incorrect
        },
        all_attempts: {
          tests: allAttempts.tests_count,
          questions: allAttempts.questions_count,
          accuracy: allAttempts.average_score,
          time: allAttempts.average_time_per_question,
          correct: allAttempts.total_correct,
          incorrect: allAttempts.total_incorrect
        },
        improvement_rate: {
          accuracy: allAttempts.average_score - firstAttempt.average_score,
          time: allAttempts.average_time_per_question - firstAttempt.average_time_per_question,
          questions: allAttempts.questions_count - firstAttempt.questions_count
        }
      };
    });
  }

  /**
   * Obtiene información de ranking por nivel del usuario - SIMPLIFICADO
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
   * Obtiene comparativas de nivel vs comunidad - SIMPLIFICADO
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
        color: this.getLevelColor(level),
        icon: this.getLevelIcon(level),
        comparisons: {
          accuracy_all: {
            user: allAttempts.average_score,
            community: communityStats.avg_accuracy_all,
            improvement: this.calculateImprovement(
              allAttempts.average_score,
              communityStats.avg_accuracy_all,
              true
            ),
            is_better: allAttempts.average_score > communityStats.avg_accuracy_all
          },
          time_all: {
            user: allAttempts.average_time_per_question,
            community: communityStats.avg_time_per_question_all,
            improvement: this.calculateImprovement(
              allAttempts.average_time_per_question,
              communityStats.avg_time_per_question_all,
              false
            ),
            is_better: allAttempts.average_time_per_question < communityStats.avg_time_per_question_all
          },
          accuracy_first: {
            user: firstAttempt.average_score,
            community: communityStats.avg_accuracy_first,
            improvement: this.calculateImprovement(
              firstAttempt.average_score,
              communityStats.avg_accuracy_first,
              true
            ),
            is_better: firstAttempt.average_score > communityStats.avg_accuracy_first
          },
          time_first: {
            user: firstAttempt.average_time_per_question,
            community: communityStats.avg_time_per_question_first,
            improvement: this.calculateImprovement(
              firstAttempt.average_time_per_question,
              communityStats.avg_time_per_question_first,
              false
            ),
            is_better: firstAttempt.average_time_per_question < communityStats.avg_time_per_question_first
          }
        }
      };
    }).filter(Boolean);
  }

  /**
   * Obtiene los rankings por tipo
   */
  getRankingByType(rankingsResponse: RankingsResponse, type: string): RankingItem[] {
    if (!rankingsResponse) return [];
    
    switch(type) {
      case 'tests': return rankingsResponse.top_by_tests || [];
      case 'time_all': return rankingsResponse.top_by_avg_time_per_question_all || [];
      case 'time_first': return rankingsResponse.top_by_avg_time_per_question_first || [];
      case 'accuracy_all': return rankingsResponse.top_by_accuracy_all || [];
      case 'accuracy_first': return rankingsResponse.top_by_accuracy_first || [];
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
   * Obtiene distribución de tests por nivel
   */
  getLevelDistribution(levelStats: LevelStatsMap, totalTests: number): any[] {
    if (!levelStats || totalTests === 0) return [];
    
    return Object.keys(levelStats).map(level => {
      const levelTests = levelStats[level].all_attempts.tests_count;
      return {
        level,
        tests: levelTests,
        percentage: (levelTests / totalTests) * 100,
        color: this.getLevelColor(level)
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Helper: Calcula percentil - MEJORADO
   */
  calculatePercentile(position: number, total: number, higherIsBetter: boolean = true): number {
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
  calculateImprovement(userValue: number, communityValue: number, higherIsBetter: boolean): number {
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
  private calculateEfficiencyScore(personalStats: PersonalStats): number {
    if (personalStats.tests_completed === 0) return 0;
    
    const accuracy = personalStats.average_score;
    const avgTime = personalStats.average_time_per_question;
    
    // Puntuación basada en precisión (70%) y tiempo (30%)
    const timeScore = avgTime > 0 ? Math.min(100, (300 / avgTime) * 100) : 0;
    const accuracyScore = accuracy || 0;
    
    return Math.round((accuracyScore * 0.7) + (timeScore * 0.3));
  }


  /**
   * Helper: Obtiene icono para nivel
   */
  getLevelIcon(level: string): string {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('principiante')) return '🟦';
    if (normalizedLevel.includes('intermedio')) return '🟩';
    if (normalizedLevel.includes('avanzado')) return '🟪';
    return '📊';
  }

  /**
   * Helper: Obtiene color para nivel
   */
  getLevelColor(level: string): string {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('principiante')) return '#3b82f6';
    if (normalizedLevel.includes('intermedio')) return '#10b981';
    if (normalizedLevel.includes('avanzado')) return '#8b5cf6';
    return '#6b7280';
  }

  /**
   * Obtiene el nombre del nivel basado en el porcentaje de precisión
   */
  getLevelByAccuracy(accuracy: number): string {
    if (accuracy >= 80) return 'Avanzado';
    if (accuracy >= 60) return 'Intermedio';
    return 'Principiante';
  }

  /**
   * Calcula el nivel global del usuario basado en sus estadísticas
   */
  calculateUserLevel(personalStats: PersonalStats, levelStats: LevelStatsMap): string {
    if (!personalStats || !levelStats) return 'Principiante';
    
    // Calcular promedio ponderado de precisión por nivel
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
    return this.formatTimeSince(this.dashboardCacheTimestamp);
  }

  /**
   * Obtiene tiempo desde última actualización de rankings
   */
  getTimeSinceRankingsUpdate(): string {
    if (!this.rankingsCacheTimestamp) return 'Nunca';
    return this.formatTimeSince(this.rankingsCacheTimestamp);
  }

  /**
   * Helper: Formatea tiempo desde timestamp
   */
  private formatTimeSince(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  }

  /**
   * Formatea valores de mejora para mostrar en UI
   */
  formatImprovement(improvement: number, type: 'accuracy' | 'time' | 'tests' | 'general' = 'general'): string {
    if (improvement === 0) return 'Igual';
    
    const absImprovement = Math.abs(improvement);
    const sign = improvement > 0 ? '+' : '-';
    
    switch(type) {
      case 'accuracy':
        return `${sign}${absImprovement.toFixed(1)}% ${improvement > 0 ? 'mejor' : 'peor'}`;
      case 'time':
        return `${sign}${absImprovement.toFixed(1)}% ${improvement > 0 ? 'más rápido' : 'más lento'}`;
      case 'tests':
        return `${sign}${absImprovement.toFixed(1)}% ${improvement > 0 ? 'más tests' : 'menos tests'}`;
      default:
        return `${sign}${absImprovement.toFixed(1)}%`;
    }
  }

  /**
   * Determina si una mejora es positiva o negativa
   */
  isImprovementPositive(improvement: number, higherIsBetter: boolean = true): boolean {
    if (higherIsBetter) {
      return improvement > 0;
    } else {
      return improvement > 0; // Para tiempo, positivo significa más rápido (mejor)
    }
  }

  /**
   * Obtiene clase CSS para una mejora
   */
  getImprovementClass(improvement: number, higherIsBetter: boolean = true): string {
    const isPositive = this.isImprovementPositive(improvement, higherIsBetter);
    
    if (isPositive) {
      return 'text-emerald-600 dark:text-emerald-400';
    } else if (improvement === 0) {
      return 'text-gray-600 dark:text-gray-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  }

  /**
   * Obtiene icono para una mejora
   */
  getImprovementIcon(improvement: number, higherIsBetter: boolean = true): string {
    const isPositive = this.isImprovementPositive(improvement, higherIsBetter);
    
    if (improvement === 0) return '➡️';
    return isPositive ? '⬆️' : '⬇️';
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
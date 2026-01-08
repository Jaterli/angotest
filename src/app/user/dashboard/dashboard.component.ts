import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardService } from '../../shared/services/user-dashboard.service';
import { 
  DashboardStats, 
  RankingsResponse,
  LEVELS,
} from '../../shared/models/user-dashboard.model';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .progress-bar {
      transition: width 0.3s ease-in-out;
    }
    .chart-bar {
      transition: height 0.5s ease-in-out;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Signals
  dashboardData = signal<DashboardStats | null>(null);
  rankingsData = signal<RankingsResponse | null>(null);
  loading = signal(false);
  rankingsLoading = signal(false);
  error = signal<string | null>(null);
  lastUpdated = signal<string>('');

  // Nueva signal para controlar si se deben mostrar las comparativas con comunidad
  showCommunityComparison = signal(false);

  // Estado para tabs de rankings
  activeRankingTab = signal<string>('tests');
  activeLevelRankingTab = signal<string>('Principiante');

  // Computed signals
  personalStats = computed(() => this.dashboardData()?.personal_stats);
  levelStats = computed(() => this.dashboardData()?.level_stats);
  
  // Estadísticas del usuario actual (desde rankings)
  currentUserPosition = computed(() => this.rankingsData()?.current_user_position);
  communityAverages = computed(() => this.rankingsData()?.community_averages);
  
  // Nueva computed para total de usuarios activos
  totalActiveUsers = computed(() => this.dashboardData()?.total_active_users || 0);

  // Estadísticas de respuestas correctas/incorrectas
  accuracyPersonalStats = computed(() => {
    const stats = this.personalStats();
    if (!stats) return {
      correct_answers: 0,
      wrong_answers: 0,
      total_answers: 0,
      accuracy_percentage: 0
    };
    
    const correct = stats.all_attempts.total_correct || 0;
    const wrong = stats.all_attempts.total_wrong || 0;
    const total = correct + wrong;
    
    return {
      correct_answers: correct,
      wrong_answers: wrong,
      total_answers: total,
      accuracy_percentage: total > 0 ? (correct / total) * 100 : 0
    };
  });

  // Estadísticas de tiempo formateadas
  timePersonalStats = computed(() => {
    const stats = this.personalStats();
    return stats ? this.dashboardService.getFormattedTimeStats(stats) : {
      average_time_per_question: '0s',
      average_time_first_attempt: '0s',
      total_time_invested: '0s',
      efficiency_score_first_attempt: 0,
      efficiency_score_all_attempts: 0
    };
  });
  
  // Usuario
  currentUser: User | null = null;
 
  totalTests = computed(() => {
    const stats = this.personalStats();
    if (!stats) return 0;
    return stats.all_attempts.tests_count + stats.in_progress_tests + stats.abandoned_tests;
  });

  completionPercentage = computed(() => {
    const stats = this.personalStats();
    if (!stats || this.totalTests() === 0) return 0;
    return (stats.all_attempts.tests_count / this.totalTests()) * 100;
  });

  timeDifference = computed(() => {
    const stats = this.personalStats();
    if (!stats) return 0;
    return stats.first_attempt.average_time_taken_per_question - stats.all_attempts.average_time_taken_per_question;
  });

  // Estadísticas de mejora entre intentos
  improvementStats = computed(() => {
    const stats = this.personalStats();
    if (!stats) return {
      accuracy_improvement: 0,
      time_improvement: 0,
      questions_improvement: 0
    };
    
    const accuracyImprovement = stats.all_attempts.average_score - stats.first_attempt.average_score;
    const timeImprovement = stats.first_attempt.average_time_taken_per_question - stats.all_attempts.average_time_taken_per_question;
    const questionsImprovement = stats.all_attempts.total_questions_answered - stats.first_attempt.total_questions_answered;

    return {
      accuracy_improvement: accuracyImprovement,
      time_improvement: timeImprovement,
      questions_improvement: questionsImprovement
    };
  });

  // Comparaciones con comunidad - Solo disponible si hay rankings cargados
  communityComparison = computed(() => {
    if (!this.showCommunityComparison()) return null;
    const personal = this.personalStats();
    const community_averages = this.rankingsData()?.community_averages;
    if (!personal || !community_averages) return null;
    
    return this.dashboardService.getCommunityComparison(personal, community_averages);
  });

  // Estadísticas por nivel
  levelProgress = computed(() => {
    const stats = this.levelStats();
    const personal = this.personalStats();
    return stats && personal ? 
      this.dashboardService.getLevelProgress(stats, personal) : 
      [];
  });

  levelDetails = computed(() => {
    const stats = this.levelStats();
    return stats ? this.dashboardService.getLevelDetails(stats) : [];
  });

  // Distribución de tests por nivel
  levelDistribution = computed(() => {
    const stats = this.levelStats();
    const total = this.personalStats()?.first_attempt?.tests_count || 0;
    
    if (!stats || total === 0) return [];
    
    const distribution = this.dashboardService.getLevelDistribution(stats, total);
    
    // Agregar más métricas de nivel
    return distribution.map(item => {
      const levelData = stats[item.level];
      if (!levelData) return item;
      
      const firstAttempt = levelData.first_attempt;
      const allAttempts = levelData.all_attempts;
      
      return {
        ...item,
        accuracy_first_attempt: firstAttempt?.average_score || 0,
        time_taken_first_attempt: firstAttempt?.average_time_taken_per_question || 0,
        total_questions_first_attempt: firstAttempt?.questions_count || 0,
        total_correct_first_attempt: firstAttempt?.total_correct || 0,
        total_wrong_first_attempt: firstAttempt?.total_wrong || 0,
        accuracy_all_attempts: allAttempts?.average_score || 0,
        time_taken_all_attempts: allAttempts?.average_time_taken_per_question || 0,
        total_questions_all_attempts: allAttempts?.questions_count || 0,
        total_correct_all_attempts: allAttempts?.total_correct || 0,
        total_wrong_all_attempts: allAttempts?.total_wrong || 0,
        accuracy_improvement: (allAttempts?.average_score || 0) - (firstAttempt?.average_score || 0),
        time_taken_improvement: (firstAttempt?.average_time_taken_per_question || 0) - (allAttempts?.average_time_taken_per_question || 0)
      };
    });
  });

  // Estadísticas de nivel para sección ampliada
  levelDetailedStats = computed(() => {
    const stats = this.levelStats();
    if (!stats) return [];
    
    return Object.keys(stats).map(level => {
      const levelData = stats[level];
      return {
        level,
        first_attempt: levelData.first_attempt,
        all_attempts: levelData.all_attempts
      };
    });
  });

  // Posiciones en rankings - Solo disponible si hay rankings cargados
  rankingUserPositions = computed(() => {
    if (!this.showCommunityComparison()) return [];
    const rankingsUserPosition = this.rankingsData()?.current_user_position;
    return rankingsUserPosition ? this.dashboardService.getUserRankingPositions(rankingsUserPosition) : [];
  });

  // Rankings actuales según tab activo
  currentRankings = computed(() => {
    const rankings = this.rankingsData();
    return rankings ? this.dashboardService.getRankingByType(rankings, this.activeRankingTab()) : [];
  });

  currentLevelRankings = computed(() => {
    const rankings = this.rankingsData();
    const level = this.activeLevelRankingTab();
    return rankings ? this.dashboardService.getRankingsByLevel(rankings, level) : [];
  });


  currentLevelRankingsAccuracy = computed(() => {
    const rankings = this.rankingsData();
    const level = this.activeLevelRankingTab();
    return rankings ? this.dashboardService.getRankingsByLevelAccuracy(rankings, level) : [];
  });

  // Helper para valores absolutos
  abs(value: number): number {
    return Math.abs(value);
  }

  ngOnInit() {
    this.loadDashboardData();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.currentUser = currentUser;
    }
  }

  loadDashboardData(forceRefresh: boolean = false) {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getDashboardWithCache(forceRefresh)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.lastUpdated.set(this.dashboardService.getTimeSinceDashboardUpdate());
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err.message || 'Error al cargar el dashboard');
          this.loading.set(false);
        }
      });
  }

  // Método para cargar rankings solo cuando el usuario lo solicite
  loadCommunityComparison(): void {
    if (this.rankingsData()) {
      // Si ya tenemos datos, solo mostramos la sección
      this.showCommunityComparison.set(true);
      return;
    }
    
    this.rankingsLoading.set(true);
    this.showCommunityComparison.set(true);

    this.dashboardService.getRankingsWithCache(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.rankingsData.set(data);
          this.rankingsLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading rankings:', err);
          this.rankingsLoading.set(false);
          // Ocultamos la sección si hay error
          this.showCommunityComparison.set(false);
        }
      });
  }

  // Método para ocultar la comparativa con comunidad
  hideCommunityComparison(): void {
    this.showCommunityComparison.set(false);
  }

  loadRankingsData() {
    this.rankingsLoading.set(true);

    this.dashboardService.getRankingsWithCache(10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.rankingsData.set(data);
          this.rankingsLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading rankings:', err);
          this.rankingsLoading.set(false);
        }
      });
  }

  // Helper methods
  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  formatTimeShort(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  formatTimeDifference(difference: number): string {
    const absDiff = Math.abs(difference);
    const formatted = this.formatTime(absDiff);
    return difference >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  getTimeDifferenceClass(difference: number): string {
    if (difference < -60) return 'text-emerald-600 dark:text-emerald-400';
    if (difference < 0) return 'text-emerald-500 dark:text-emerald-300';
    if (difference < 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  getPositionColor(category: string): string {
    switch (category) {
      case 'Tiempo Promedio': return '#10b981';
      case 'Tiempo 1er Intento': return '#f59e0b';
      case 'Tests Completados': return '#3b82f6';
      case 'Precisión General': return '#8b5cf6';
      case 'Precisión 1er Intento': return '#ec4899';
      case 'Preguntas Respondidas': return '#06b6d4';
      default: return '#6b7280';
    }
  }

  getPercentileColor(percentile: number): string {
    if (percentile >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (percentile >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentile >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  }

  getRankingItemClass(index: number, userId: number): string {
    const currentUserId = this.authService.currentUser()?.id;
    const isCurrentUser = currentUserId && userId === currentUserId;
    
    if (isCurrentUser) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800';
    }
    
    switch (index) {
      case 0: return 'bg-amber-50 dark:bg-amber-900/20';
      case 1: return 'bg-gray-50 dark:bg-gray-900/50';
      case 2: return 'bg-amber-100/20 dark:bg-amber-900/10';
      default: return 'hover:bg-gray-50 dark:hover:bg-gray-900/50';
    }
  }

  // Métodos para manejar datos de nivel
  getLevelKeys(): string[] {
    const data = this.rankingsData();
    return data && data.top_by_levels ? Object.keys(data.top_by_levels) : [...LEVELS];
  }

  getMyLevelPosition(level: string): number | null {
    const data = this.rankingsData();
    return data?.current_user_position?.levels[level].first_attempt || null;
  }

  formatRankingValue(value: number, category: string): string {
    if (category.includes('Tiempo')) {
      return this.formatTime(value);
    } else if (category.includes('Precisión')) {
      return `${value.toFixed(2)}%`;
    } else {
      return value.toString();
    }
  }

  setRankingTab(tab: string): void {
    this.activeRankingTab.set(tab);
  }

  setLevelRankingTab(level: string): void {
    this.activeLevelRankingTab.set(level);
  }

  getRankingTabLabel(tab: string): string {
    switch(tab) {
      case 'tests': return 'Tests Completados';
      case 'time_all': return 'Tiempo Promedio/pregunta';
      case 'time_first': return 'Tiempo 1er Intento/pregunta';
      case 'accuracy_all': return 'Precisión General';
      case 'accuracy_first': return 'Precisión 1er Intento';
      case 'questions': return 'Preguntas Respondidas';
      default: return tab;
    }
  }

  // Calcular porcentaje de participación en niveles
  getLevelParticipationPercentage(level: string): number {
    const levelStats = this.levelStats();
    const totalTests = this.personalStats()?.all_attempts.tests_count || 0;
    
    if (!levelStats || !totalTests || totalTests === 0) return 0;
    
    const levelTests = levelStats[level]?.first_attempt.tests_count || 0;
    return (levelTests / totalTests) * 100;
  }

  getLevelColorClass(level: string): string {
    const color = this.getLevelColor(level);
    switch(color) {
      case '#3b82f6': return 'border-blue-500 text-blue-600 dark:text-blue-400';
      case '#10b981': return 'border-emerald-500 text-emerald-600 dark:text-emerald-400';
      case '#8b5cf6': return 'border-purple-500 text-purple-600 dark:text-purple-400';
      default: return 'border-gray-500 text-gray-600 dark:text-gray-400';
    }
  }

  /**
   * Obtiene clase CSS para una mejora
   */
  getImprovementColor(improvement: number, higherIsBetter: boolean = true): string {
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
   * Determina si una mejora es positiva o negativa
   */
  isImprovementPositive(improvement: number, higherIsBetter: boolean = true): boolean {
    if (higherIsBetter) {
      return improvement > 0;
    } else {
      // Para tiempo, positivo significa más rápido (mejor)
      return improvement > 0;
    }
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

  // Método para refrescar todos los datos
  refreshAllData(): void {
    this.loadDashboardData(true);
    // Si ya estamos mostrando comparativas, refrescamos también los rankings
    if (this.showCommunityComparison() && this.rankingsData()) {
      this.loadRankingsData();
    }
  }

  // Métodos auxiliares para formato
  formatPercentage(value: number): string {
    return value.toFixed(2) + '%';
  }

  getImprovementSymbol(improvement: number, type: 'accuracy' | 'time'): string {
    if (improvement === 0) return '➡️';
    if (type === 'accuracy') {
      return improvement > 0 ? '⬆️' : '⬇️';
    } else {
      return improvement > 0 ? '⬇️' : '⬆️';
    }
  }

  getImprovementText(improvement: number, type: 'accuracy' | 'time'): string {
    if (improvement === 0) return 'Sin cambio';
    
    const absValue = Math.abs(improvement);
    if (type === 'accuracy') {
      return improvement > 0 
        ? `+${absValue.toFixed(2)}% mejora` 
        : `${absValue.toFixed(2)}% disminución`;
    } else {
      return improvement > 0 
        ? `${absValue.toFixed(1)}s más rápido` 
        : `${absValue.toFixed(1)}s más lento`;
    }
  }
}
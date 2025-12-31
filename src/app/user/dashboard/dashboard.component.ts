import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardService } from '../../shared/services/user-dashboard.service';
import { DashboardStats, PersonalStats, RankingStats, LevelStats, RankingsResponse, LevelPosition } from '../../shared/models/user-dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .progress-bar {
      transition: width 0.3s ease-in-out;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);

  // Signals
  dashboardData = signal<DashboardStats | null>(null);
  rankingsData = signal<RankingsResponse | null>(null);
  loading = signal(false);
  rankingsLoading = signal(false);
  error = signal<string | null>(null);
  showRankings = signal(false);
  lastUpdated = signal<string>('');

  // Computed signals
  personalStats = computed(() => this.dashboardData()?.personal_stats);
  rankingStats = computed(() => this.dashboardData()?.ranking_stats);
  levelStats = computed(() => this.dashboardData()?.level_stats);
  
  abs(value: number): number {
    return Math.abs(value);
  }

  timeStats = computed(() => {
    const stats = this.personalStats();
    return stats ? this.dashboardService.getFormattedTimeStats(stats) : {
      average_time_per_question: '0s',
      average_time_first_attempt: '0s',
      total_time_invested: '0s',
      efficiency_score: 0
    };
  });
  
  accuracyStats = computed(() => {
    const stats = this.personalStats();
    return stats ? this.dashboardService.getAccuracyStats(stats) : {
      accuracy_percentage: 0,
      total_answers: 0,
      correct_answers: 0,
      incorrect_answers: 0
    };
  });
  
  rankingPositions = computed(() => {
    const stats = this.rankingStats();
    const rankings = this.rankingsData();
    return stats ? this.dashboardService.getRankingPositions(stats, rankings || undefined) : [];
  });
  
  totalTests = computed(() => {
    const stats = this.personalStats();
    if (!stats) return 0;
    return stats.tests_completed + stats.tests_in_progress + stats.tests_abandoned;
  });

  completionPercentage = computed(() => {
    const stats = this.personalStats();
    if (!stats || this.totalTests() === 0) return 0;
    return (stats.tests_completed / this.totalTests()) * 100;
  });

  efficiencyScore = computed(() => {
    return this.timeStats().efficiency_score;
  });

  timeDifference = computed(() => {
    const stats = this.personalStats();
    if (!stats) return 0;
    return stats.average_time_per_question_first_attempt - stats.average_time_per_question;
  });

  // Estadísticas de primer intento vs todos los intentos
  firstAttemptAccuracy = computed(() => {
    const stats = this.personalStats();
    if (!stats || stats.total_questions_first_attempt === 0) return 0;
    const correctFirst = stats.total_correct.first_attempt || 0;
    return (correctFirst / stats.total_questions_first_attempt) * 100;
  });

  allAttemptsAccuracy = computed(() => {
    const stats = this.personalStats();
    if (!stats) return 0;
    return this.accuracyStats().accuracy_percentage;
  });

  // Nuevas estadísticas computadas
  improvementVsCommunity = computed(() => {
    const personal = this.personalStats();
    const rankings = this.rankingsData();
    
    if (!personal || !rankings) return null;
    
    return {
      time_all: this.calculateImprovement(
        personal.average_time_per_question,
        rankings.community_averages.avg_time_per_question_all,
        false
      ),
      time_first: this.calculateImprovement(
        personal.average_time_per_question_first_attempt,
        rankings.community_averages.avg_time_per_question_first,
        false
      ),
      accuracy_all: this.calculateImprovement(
        this.accuracyStats().accuracy_percentage,
        rankings.community_averages.accuracy_all,
        true
      ),
      accuracy_first: this.calculateImprovement(
        this.firstAttemptAccuracy(),
        rankings.community_averages.accuracy_first,
        true
      )
    };
  });

  levelComparisons = computed(() => {
    const levelStats = this.levelStats();
    const rankings = this.rankingsData();
    
    if (!levelStats || !rankings?.community_averages?.levels) return null;
    
    const comparisons: any = {};
    Object.keys(levelStats).forEach(level => {
      const userStats = levelStats[level];
      const communityStats = rankings.community_averages.levels[level];
      
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
          tests_improvement: this.calculateImprovement(
            userStats.all_attempts.tests_count,
            communityStats.avg_tests_per_user,
            true
          ),
          community_avg_time: communityStats.avg_time_per_question_all,
          community_avg_accuracy: communityStats.avg_accuracy_all,
          community_avg_tests: communityStats.avg_tests_per_user,
          total_users: communityStats.total_users_with_level
        };
      }
    });
    
    return comparisons;
  });

  totalQuestionsAnswered = computed(() => {
    const rankings = this.rankingsData();
    if (!rankings?.my_position?.questions_answered) return 0;
    return rankings.my_position.questions_answered;
  });

  communityComparison = computed(() => {
    const rankings = this.rankingsData();
    return rankings ? this.dashboardService.getCommunityComparison(rankings) : null;
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData(forceRefresh: boolean = false) {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getDashboardWithCache(forceRefresh)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.lastUpdated.set(this.dashboardService.getTimeSinceLastUpdate());
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err.message || 'Error al cargar el dashboard');
          this.loading.set(false);
        }
      });
  }

  loadRankingsData() {
    this.showRankings.set(true);
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
    return this.dashboardService.formatTime(seconds);
  }

  formatTimeShort(seconds: number): string {
    return this.dashboardService.formatTimeShort(seconds);
  }

  formatTimeDifference(difference: number): string {
    const absDiff = Math.abs(difference);
    const formatted = this.formatTimeShort(absDiff);
    return difference >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  getTimeDifferenceClass(difference: number): string {
    if (difference < -60) return 'text-emerald-600 dark:text-emerald-400'; // Mucho más rápido
    if (difference < 0) return 'text-emerald-500 dark:text-emerald-300'; // Más rápido
    if (difference < 60) return 'text-amber-600 dark:text-amber-400'; // Similar
    return 'text-red-600 dark:text-red-400'; // Más lento
  }

  getPositionColor(category: string): string {
    switch (category) {
      case 'Tiempo Promedio': return '#10b981'; // emerald-500
      case 'Primer Intento': return '#f59e0b'; // amber-500
      case 'Tests Completados': return '#3b82f6'; // blue-500
      case 'Precisión': return '#8b5cf6'; // purple-500
      default: return '#6b7280'; // gray-500
    }
  }

  getPercentileColor(percentile: number): string {
    if (percentile >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (percentile >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentile >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  }

  getImprovementColor(improvement: number, higherIsBetter: boolean = true): string {
    if (higherIsBetter) {
      if (improvement > 20) return 'text-emerald-600 dark:text-emerald-400';
      if (improvement > 10) return 'text-emerald-500 dark:text-emerald-300';
      if (improvement > 0) return 'text-emerald-400 dark:text-emerald-200';
      if (improvement > -10) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    } else {
      // Para tiempo, menor es mejor (mejora negativa es buena)
      if (improvement > 20) return 'text-emerald-600 dark:text-emerald-400';
      if (improvement > 10) return 'text-emerald-500 dark:text-emerald-300';
      if (improvement > 0) return 'text-emerald-400 dark:text-emerald-200';
      if (improvement > -10) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    }
  }

  getImprovementIcon(improvement: number, higherIsBetter: boolean = true): string {
    if (higherIsBetter) {
      return improvement > 0 ? '↑' : '↓';
    } else {
      // Para tiempo, mejora negativa es buena
      return improvement > 0 ? '↓' : '↑';
    }
  }

  getImprovementText(improvement: number, higherIsBetter: boolean = true): string {
    const absImprovement = Math.abs(improvement);
    const icon = this.getImprovementIcon(improvement, higherIsBetter);
    
    if (improvement === 0) return 'Igual que la comunidad';
    
    if (higherIsBetter) {
      return improvement > 0 
        ? `${icon} ${absImprovement.toFixed(1)}% mejor que la comunidad`
        : `${icon} ${absImprovement.toFixed(1)}% peor que la comunidad`;
    } else {
      // Para tiempo
      return improvement > 0 
        ? `${icon} ${absImprovement.toFixed(1)}% más rápido que la comunidad`
        : `${icon} ${absImprovement.toFixed(1)}% más lento que la comunidad`;
    }
  }

  getRankingItemClass(index: number, userId: number): string {
    const isCurrentUser = userId === this.authService.currentUser()?.id;
    
    if (isCurrentUser) {
      return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
    }
    
    switch (index) {
      case 0: return 'bg-amber-50 dark:bg-amber-900/20';
      case 1: return 'bg-gray-50 dark:bg-gray-900/50';
      case 2: return 'bg-amber-100/20 dark:bg-amber-900/10';
      default: return 'hover:bg-gray-50 dark:hover:bg-gray-900/50';
    }
  }

  // Métodos para formatear estadísticas de nivel
  getLevelStatsKeys(): string[] {
    const stats = this.levelStats();
    return stats ? Object.keys(stats) : [];
  }

  // Nuevos métodos para manejar los datos del endpoint de rankings
  getLevelKeys(): string[] {
    const data = this.rankingsData();
    return data ? Object.keys(data.top_by_levels || {}) : [];
  }

  getLevelRankings(level: string): any[] {
    const data = this.rankingsData();
    return data ? (data.top_by_levels[level] || []) : [];
  }

  getMyLevelPosition(level: string): LevelPosition | null {
    const data = this.rankingsData();
    return data ? data.my_position?.levels?.[level] : null;
  }

  getCommunityLevelStats(level: string): any {
    const data = this.rankingsData();
    return data ? data.community_averages?.levels?.[level] : null;
  }

  // Métodos de cálculo
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

  getLevelComparison(level: string): any {
    const comparisons = this.levelComparisons();
    return comparisons ? comparisons[level] : null;
  }

  // Método para obtener colores de nivel
  getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'principiante': return '#3b82f6'; // blue
      case 'intermedio': return '#10b981'; // emerald
      case 'avanzado': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  }

  // Método para formatear valores de ranking
  formatRankingValue(value: number, category: string): string {
    if (category.includes('Tiempo')) {
      return this.formatTimeShort(value);
    } else if (category.includes('Precisión')) {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toString();
    }
  }
}
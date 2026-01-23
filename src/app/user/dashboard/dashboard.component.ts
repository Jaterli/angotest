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

  // Control de intentos (first_attempt vs all_attempts)
  attemptType = signal<'first_attempt' | 'all_attempts'>('first_attempt');
  
  // Control de visibilidad de rankings
  showRankings = signal(false);

  // Estado para tabs de rankings
  activeRankingTab = signal<string>('tests');
  activeLevelRankingTab = signal<string>('Principiante');

  // Computed signals
  personalData = computed(() => this.dashboardData()?.personal_data);
  levelData = computed(() => this.dashboardData()?.level_data);
  
  // Estadísticas del usuario actual (desde rankings)
  currentUserPositions = computed(() => this.rankingsData()?.current_user_positions);
  communityAverages = computed(() => this.rankingsData()?.community_averages);
  
  // Computed para datos actuales según attemptType
  currentAttemptData = computed(() => {
    const personal = this.personalData();
    if (!personal) return null;
    
    return this.attemptType() === 'first_attempt' 
      ? personal.first_attempt 
      : personal.all_attempts;
  });

  // Estadísticas calculadas para la UI
  currentAccuracy = computed(() => {
    const current = this.currentAttemptData();
    if (!current) return 0;
    
    const total = current.total_correct + current.total_wrong;
    return total > 0 ? (current.total_correct / total) * 100 : 0;
  });

  currentAverageTimePerQuestion = computed(() => {
    const current = this.currentAttemptData();
    if (!current || current.total_questions_answered === 0) return 0;
    
    return current.total_time_taken / current.total_questions_answered;
  });

  // Comparación entre intentos
  improvementData = computed(() => {
    const personal = this.personalData();
    if (!personal) return null;
    
    const firstAttempt = personal.first_attempt;
    const allAttempts = personal.all_attempts;
    
    // Calcular precisión
    const firstTotal = firstAttempt.total_correct + firstAttempt.total_wrong;
    const allTotal = allAttempts.total_correct + allAttempts.total_wrong;
    
    const firstAccuracy = firstTotal > 0 ? (firstAttempt.total_correct / firstTotal) * 100 : 0;
    const allAccuracy = allTotal > 0 ? (allAttempts.total_correct / allTotal) * 100 : 0;
    
    // Calcular tiempo promedio por pregunta
    const firstAvgTime = firstAttempt.total_questions_answered > 0 
      ? firstAttempt.total_time_taken / firstAttempt.total_questions_answered : 0;
    const allAvgTime = allAttempts.total_questions_answered > 0 
      ? allAttempts.total_time_taken / allAttempts.total_questions_answered : 0;
    
    return {
      accuracy_improvement: allAccuracy - firstAccuracy,
      time_improvement: firstAvgTime - allAvgTime, // Positivo = más rápido en intentos adicionales
      questions_improvement: allAttempts.total_questions_answered - firstAttempt.total_questions_answered
    };
  });

  // Datos de nivel según attemptType actual
  levelStatsByAttempt = computed(() => {
    const levels = this.levelData();
    const attemptType = this.attemptType();
    
    if (!levels) return [];
    
    return Object.keys(levels).map(level => {
      const levelData = levels[level];
      const attemptData = levelData[attemptType];
      
      // Calcular precisión para este nivel
      const totalQuestions = attemptData.total_correct + attemptData.total_wrong;
      const accuracy = totalQuestions > 0 ? (attemptData.total_correct / totalQuestions) * 100 : 0;
      const avgTimePerQuestion = attemptData.questions_count > 0 
        ? attemptData.total_time_taken / attemptData.questions_count : 0;
      
      return {
        level,
        tests_count: attemptData.tests_count,
        questions_count: attemptData.questions_count,
        total_correct: attemptData.total_correct,
        total_wrong: attemptData.total_wrong,
        total_time_taken: attemptData.total_time_taken,
        accuracy,
        avg_time_per_question: avgTimePerQuestion
      };
    }).sort((a, b) => 
      LEVELS.indexOf(a.level as any) - LEVELS.indexOf(b.level as any)
    );
  });

  // Total de tests del usuario
  totalUserTests = computed(() => {
    const personal = this.personalData();
    if (!personal) return 0;
    
    return personal.completed_tests + personal.in_progress_tests + personal.abandoned_tests;
  });

  // Distribución de tests por nivel
  levelDistribution = computed(() => {
    const levelData = this.levelData();
    if (!levelData) return [];
    
    const totalTests = this.personalData()?.first_attempt.tests_count || 0;
    
    return Object.keys(levelData).map(level => {
      const levelTests = levelData[level].first_attempt.tests_count;
      const percentage = totalTests > 0 ? (levelTests / totalTests) * 100 : 0;
      
      return {
        level,
        tests: levelTests,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);
  });

  // Rankings actuales según tab activo
  currentRankings = computed(() => {
    const rankings = this.rankingsData();
    if (!rankings) return [];
    
    switch(this.activeRankingTab()) {
      case 'tests': return rankings.top_by_tests || [];
      case 'time_all': return rankings.top_by_avg_time_taken_per_question?.all_attempts || [];
      case 'time_first': return rankings.top_by_avg_time_taken_per_question?.first_attempt || [];
      case 'accuracy_all': return rankings.top_by_accuracy?.all_attempts || [];
      case 'accuracy_first': return rankings.top_by_accuracy?.first_attempt || [];
      case 'questions_all': return rankings.top_by_questions_answered?.all_attempts || [];
      case 'questions_first': return rankings.top_by_questions_answered?.first_attempt || [];
      default: return [];
    }
  });

  currentLevelRankings = computed(() => {
    const rankings = this.rankingsData();
    const level = this.activeLevelRankingTab();
    return rankings?.top_by_levels?.[level] || [];
  });

  currentLevelRankingsAccuracy = computed(() => {
    const rankings = this.rankingsData();
    const level = this.activeLevelRankingTab();
    return rankings?.top_by_levels_accuracy?.[level] || [];
  });

  // Usuario
  currentUser: User | null = null;

  ngOnInit() {
    this.loadDashboardData();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUser = currentUser;
    }
  }

  loadDashboardData(forceRefresh: boolean = false) {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getDashboardStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err.message || 'Error al cargar el dashboard');
          this.loading.set(false);
        }
      });
  }

  // Método para cargar rankings
  loadRankings(): void {
    this.rankingsLoading.set(true);
    this.showRankings.set(true);

    this.dashboardService.getRankings(5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.rankingsData.set(data);
          this.rankingsLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading rankings:', err);
          this.rankingsLoading.set(false);
          this.showRankings.set(false);
        }
      });
  }

  // Cambiar tipo de intento
  setAttemptType(type: 'first_attempt' | 'all_attempts'): void {
    this.attemptType.set(type);
  }

  // Helper methods
  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  formatTimeShort(seconds: number): string {
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

  formatPercentage(value: number): string {
    return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
  }

  getLevelIcon(level: string): string {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('principiante')) return '🟦';
    if (normalizedLevel.includes('intermedio')) return '🟩';
    if (normalizedLevel.includes('avanzado')) return '🟪';
    return '📊';
  }

  getLevelColor(level: string): string {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel.includes('principiante')) return '#3b82f6';
    if (normalizedLevel.includes('intermedio')) return '#10b981';
    if (normalizedLevel.includes('avanzado')) return '#8b5cf6';
    return '#6b7280';
  }

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

  getImprovementIcon(improvement: number, higherIsBetter: boolean = true): string {
    const isPositive = this.isImprovementPositive(improvement, higherIsBetter);
    
    if (improvement === 0) return '➡️';
    return isPositive ? '⬆️' : '⬇️';
  }

  isImprovementPositive(improvement: number, higherIsBetter: boolean = true): boolean {
    if (higherIsBetter) {
      return improvement > 0;
    } else {
      // Para tiempo, positivo significa más rápido (mejor)
      return improvement > 0;
    }
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

  getLevelKeys(): string[] {
    const data = this.rankingsData();
    return data && data.top_by_levels ? Object.keys(data.top_by_levels) : [...LEVELS];
  }

  getMyLevelPosition(level: string): number | null {
    const data = this.rankingsData();
    return data?.current_user_positions?.levels[level]?.accuracy || null;
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
      case 'questions_all': return 'Preguntas Respondidas';
      case 'questions_first': return 'Preguntas 1er Intento';
      default: return tab;
    }
  }

  getRankingItemClass(index: number, userId: number): string {
    const currentUserId = this.currentUser?.id;
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

  formatRankingValue(value: number, category: string): string {
    if (category.includes('Tiempo')) {
      return this.formatTimeShort(value);
    } else if (category.includes('Precisión')) {
      return `${value.toFixed(2)}%`;
    } else {
      return value.toString();
    }
  }


  // Cálculos separados para comparación entre intentos
  currentAccuracyAllAttempts = computed(() => {
    const personal = this.personalData();
    if (!personal) return 0;
    
    const allAttempts = personal.all_attempts;
    const total = allAttempts.total_correct + allAttempts.total_wrong;
    return total > 0 ? (allAttempts.total_correct / total) * 100 : 0;
  });

  currentAccuracyFirstAttempt = computed(() => {
    const personal = this.personalData();
    if (!personal) return 0;
    
    const firstAttempt = personal.first_attempt;
    const total = firstAttempt.total_correct + firstAttempt.total_wrong;
    return total > 0 ? (firstAttempt.total_correct / total) * 100 : 0;
  });

  currentAverageTimePerQuestionAllAttempts = computed(() => {
    const personal = this.personalData();
    if (!personal) return 0;
    
    const allAttempts = personal.all_attempts;
    return allAttempts.total_questions_answered > 0 
      ? allAttempts.total_time_taken / allAttempts.total_questions_answered 
      : 0;
  });

  currentAverageTimePerQuestionFirstAttempt = computed(() => {
    const personal = this.personalData();
    if (!personal) return 0;
    
    const firstAttempt = personal.first_attempt;
    return firstAttempt.total_questions_answered > 0 
      ? firstAttempt.total_time_taken / firstAttempt.total_questions_answered 
      : 0;
  });



// Agregar estas propiedades y métodos a tu componente

// Métodos para rankings globales
getCurrentUserPosition(tab: string): number | string {
  const positions = this.currentUserPositions();
  if (!positions) return '-';
  
  switch(tab) {
    case 'tests': return positions.completed_tests;
    case 'time_all': return positions.all_attempts?.avg_time_taken_per_question || '-';
    case 'time_first': return positions.first_attempt?.avg_time_taken_per_question || '-';
    case 'accuracy_all': return positions.all_attempts?.accuracy || '-';
    case 'accuracy_first': return positions.first_attempt?.accuracy || '-';
    case 'questions_all': return positions.all_attempts?.questions_answered || '-';
    case 'questions_first': return positions.first_attempt?.questions_answered || '-';
    default: return '-';
  }
}

getCurrentUserValue(tab: string): string {
  switch(tab) {
    case 'tests': 
      return (this.personalData()?.completed_tests || 0).toString();
    case 'time_all': 
      return this.formatTimeShort(this.currentAverageTimePerQuestionAllAttempts());
    case 'time_first': 
      return this.formatTimeShort(this.currentAverageTimePerQuestionFirstAttempt());
    case 'accuracy_all': 
      return `${this.currentAccuracyAllAttempts().toFixed(2)}%`;
    case 'accuracy_first': 
      return `${this.currentAccuracyFirstAttempt().toFixed(2)}%`;
    case 'questions_all': 
      return (this.personalData()?.all_attempts.total_questions_answered || 0).toString();
    case 'questions_first': 
      return (this.personalData()?.first_attempt.total_questions_answered || 0).toString();
    default: return '-';
  }
}

getRankingDescription(tab: string): string {
  switch(tab) {
    case 'tests': return 'Número total de tests completados';
    case 'time_all': return 'Tiempo promedio por pregunta en todos los intentos';
    case 'time_first': return 'Tiempo promedio por pregunta en primer intento';
    case 'accuracy_all': return 'Precisión porcentual en todos los intentos';
    case 'accuracy_first': return 'Precisión porcentual en primer intento';
    case 'questions_all': return 'Total de preguntas respondidas en todos los intentos';
    case 'questions_first': return 'Preguntas respondidas en primer intento';
    default: return '';
  }
}

getRankingUnit(tab: string): string {
  switch(tab) {
    case 'tests': return 'tests';
    case 'time_all': 
    case 'time_first': return 'segundos/pregunta';
    case 'accuracy_all': 
    case 'accuracy_first': return 'precisión %';
    case 'questions_all': 
    case 'questions_first': return 'preguntas';
    default: return '';
  }
}

getRankingTabColor(tab: string): string {
  switch(tab) {
    case 'tests': return '#3b82f6'; // blue
    case 'time_all': 
    case 'time_first': return '#10b981'; // emerald
    case 'accuracy_all': 
    case 'accuracy_first': return '#8b5cf6'; // purple
    case 'questions_all': 
    case 'questions_first': return '#06b6d4'; // cyan
    default: return '#6b7280';
  }
}

// Métodos para rankings por nivel
getLevelTestCount(level: string): number {
  return this.levelData()?.[level]?.first_attempt?.tests_count || 0;
}

getLevelAccuracy(level: string): string {
  const levelData = this.levelData()?.[level];
  if (!levelData) return '0';
  
  const firstAttempt = levelData.first_attempt;
  const total = firstAttempt.total_correct + firstAttempt.total_wrong;
  return total > 0 ? (firstAttempt.total_correct / total * 100).toFixed(2) : '0';
}

// getLevelAverageTime(level: string): string {
//   const levelData = this.levelData()?.[level];
//   if (!levelData) return '0s';
  
//   const firstAttempt = levelData.first_attempt;
//   const avgTime = firstAttempt.questions_count > 0 
//     ? firstAttempt.total_time_taken / firstAttempt.questions_count 
//     : 0;
  
//   return this.formatTimeShort(avgTime);
// }

getLevelQuestionsCount(level: string): number {
  return this.levelData()?.[level]?.first_attempt?.questions_count || 0;
}

getMyLevelAccuracyPosition(level: string): number | null {
  const positions = this.currentUserPositions();
  return positions?.levels[level]?.accuracy|| null;
}

getLevelAccuracyValue(level: string): string {
  return this.getLevelAccuracy(level);
}


  // Ocultar rankings
  hideRankings(): void {
    this.showRankings.set(false);
  }

  // Refresh
  refreshAllData(): void {
    this.loadDashboardData();
    if (this.showRankings()) {
      this.loadRankings();
    }
  }








  
}
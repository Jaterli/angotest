import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardService } from '../../shared/services/user-dashboard.service';
import { 
  DashboardStats, 
  RankingsResponse, 
  LevelPosition,
  LEVELS,
  LevelStatsMap,
  LevelComparison,
  RankingItem,

} from '../../shared/models/user-dashboard.model';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { User } from '../../shared/models/user.model';

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
  showRankings = signal(false);
  showLevelDetails = signal(false);
  lastUpdated = signal<string>('');

  // Estado para tabs de rankings
  activeRankingTab = signal<string>('tests');
  activeLevelRankingTab = signal<string>('Principiante');
  activeLevelDetailTab = signal<string>('Principiante');

  // Computed signals
  personalStats = computed(() => this.dashboardData()?.personal_stats);
  levelStats = computed(() => this.dashboardData()?.level_stats);
  
  // Estadísticas del usuario actual (desde rankings)
  currentUserPosition = computed(() => this.rankingsData()?.current_user?.position);
  communityAverages = computed(() => this.rankingsData()?.community_averages);
  
  // Nueva computed para total de usuarios activos
  totalActiveUsers = computed(() => this.dashboardData()?.total_active_users || 0);

  // Estadísticas computadas
  timeStats = computed(() => {
    const stats = this.personalStats();
    return stats ? this.dashboardService.getFormattedTimeStats(stats) : {
      average_time_per_question: '0s',
      average_time_first_attempt: '0s',
      total_time_invested: '0s',
      efficiency_score: 0
    };
  });
  
  // Usuario
  currentUser: User | null = null;


  accuracyStats = computed(() => {
    const stats = this.personalStats();
    return stats ? this.dashboardService.getAccuracyStats(stats) : {
      accuracy_percentage: 0,
      total_answers: 0,
      correct_answers: 0,
      incorrect_answers: 0,
      first_attempt_accuracy: 0,
      first_attempt_correct: 0,
      first_attempt_incorrect: 0,
      first_attempt_total: 0
    };
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

  firstAttemptAccuracy = computed(() => {
    return this.accuracyStats().first_attempt_accuracy;
  });

  allAttemptsAccuracy = computed(() => {
    return this.accuracyStats().accuracy_percentage;
  });

  // Comparaciones con comunidad
  communityComparison = computed(() => {
    const personal = this.personalStats();
    const rankings = this.rankingsData();
    if (!personal || !rankings) return null;
    
    return this.dashboardService.getCommunityComparison(personal, rankings);
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

  levelRankingInfo = computed(() => {
    const rankings = this.rankingsData();
    return rankings ? this.dashboardService.getLevelRankingInfo(rankings) : [];
  });

  levelCommunityComparisons = computed(() => {
    const stats = this.levelStats();
    const rankings = this.rankingsData();
    return stats && rankings ? 
      this.dashboardService.getLevelCommunityComparison(stats, rankings) : 
      [];
  });

  levelComparisons = computed((): LevelComparison | null => {
    const levelStats = this.levelStats();
    const communityLevelStats = this.communityAverages()?.levels;
    
    if (!levelStats || !communityLevelStats) return null;
    
    return this.dashboardService.getLevelComparisons(levelStats, communityLevelStats);
  });

  // Distribución de tests por nivel
  levelDistribution = computed(() => {
    const stats = this.levelStats();
    const total = this.personalStats()?.tests_completed || 0;
    
    if (!stats || total === 0) return [];
    
    return this.dashboardService.getLevelDistribution(stats, total);
  });

  // Posiciones en rankings
  rankingPositions = computed(() => {
    const rankings = this.rankingsData();
    return rankings ? this.dashboardService.getRankingPositions(rankings) : [];
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

  // Nivel actual del usuario
  userLevel = computed(() => {
    const stats = this.personalStats();
    const levelStats = this.levelStats();
    return stats && levelStats ? 
      this.dashboardService.calculateUserLevel(stats, levelStats) : 
      'Principiante';
  });

  // Mejor nivel por rendimiento
  bestPerformingLevel = computed(() => {
    const progress = this.levelProgress();
    if (!progress.length) return null;
    
    return progress.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
  });

  // Nivel que necesita más práctica
  needsPracticeLevel = computed(() => {
    const progress = this.levelProgress();
    if (!progress.length) return null;
    
    return progress.reduce((worst, current) => 
      current.accuracy < worst.accuracy ? current : worst
    );
  });

  // Detalles del nivel activo
  activeLevelDetails = computed(() => {
    const details = this.levelDetails();
    const activeLevel = this.activeLevelDetailTab();
    return details.find(d => d.level === activeLevel);
  });

  // Comparación del nivel activo con comunidad
  activeLevelComparison = computed(() => {
    const comparisons = this.levelCommunityComparisons();
    const activeLevel = this.activeLevelDetailTab();
    return comparisons.find(c => c.level === activeLevel);
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
          
          // Auto-cargar rankings si hay datos
          if (data) {
            this.loadRankingsData();
          }
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err.message || 'Error al cargar el dashboard');
          this.loading.set(false);
        }
      });
  }

  loadRankingsData() {
    this.rankingsLoading.set(true);

    this.dashboardService.getRankingsWithCache(5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.rankingsData.set(data);
          this.rankingsLoading.set(false);
          if (!this.showRankings()) {
            this.showRankings.set(true);
          }
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
      case 'Tiempo Promedio/pregunta': return '#10b981';
      case 'Tiempo 1er Intento/pregunta': return '#f59e0b';
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

  getImprovementColor(improvement: number, higherIsBetter: boolean = true): string {
    return this.dashboardService.getImprovementClass(improvement, higherIsBetter);
  }

  getImprovementIcon(improvement: number, higherIsBetter: boolean = true): string {
    return this.dashboardService.getImprovementIcon(improvement, higherIsBetter);
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
      return improvement > 0 
        ? `${icon} ${absImprovement.toFixed(1)}% más rápido que la comunidad`
        : `${icon} ${absImprovement.toFixed(1)}% más lento que la comunidad`;
    }
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
  getLevelStatsKeys(): string[] {
    const stats = this.levelStats();
    return stats ? Object.keys(stats) : [];
  }

  getLevelKeys(): string[] {
    const data = this.rankingsData();
    return data && data.top_by_levels ? Object.keys(data.top_by_levels) : [...LEVELS];
  }

  getMyLevelPosition(level: string): number | null {
    const data = this.rankingsData();
    return data?.current_user?.position?.accuracy_by_level_first?.[level] || null;
  }

  getCommunityLevelStats(level: string): any {
    const data = this.rankingsData();
    return data?.community_averages?.levels?.[level];
  }

  getLevelComparison(level: string): any {
    const comparisons = this.levelComparisons();
    return comparisons ? comparisons[level] : null;
  }

  getLevelColor(level: string): string {
    return this.dashboardService.getLevelColor(level);
  }

  getLevelIcon(level: string): string {
    return this.dashboardService.getLevelIcon(level);
  }

  formatRankingValue(value: number, category: string): string {
    if (category.includes('Tiempo')) {
      return this.formatTime(value);
    } else if (category.includes('Precisión')) {
      return `${value.toFixed(1)}%`;
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

  setLevelDetailTab(level: string): void {
    this.activeLevelDetailTab.set(level);
    this.showLevelDetails.set(true);
  }

  getRankingTabLabel(tab: string): string {
    switch(tab) {
      case 'tests': return 'Tests Completados';
      case 'time_all': return 'Tiempo Promedio';
      case 'time_first': return 'Tiempo 1er Intento';
      case 'accuracy_all': return 'Precisión General';
      case 'accuracy_first': return 'Precisión 1er Intento';
      case 'questions': return 'Preguntas Respondidas';
      default: return tab;
    }
  }

  // Métodos para formatear valores de comparación
  formatComparisonValue(value: number, isTime: boolean = false): string {
    if (isTime) {
      return this.formatTime(value);
    }
    return value.toFixed(1);
  }

  // Calcular porcentaje de participación en niveles
  getLevelParticipationPercentage(level: string): number {
    const levelStats = this.levelStats();
    const totalTests = this.personalStats()?.tests_completed;
    
    if (!levelStats || !totalTests || totalTests === 0) return 0;
    
    const levelTests = levelStats[level]?.all_attempts.tests_count || 0;
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

  getLevelBorderColor(level: string): string {
    const color = this.getLevelColor(level);
    return `border-2 ${color === '#3b82f6' ? 'border-blue-200 dark:border-blue-800' : 
            color === '#10b981' ? 'border-emerald-200 dark:border-emerald-800' : 
            color === '#8b5cf6' ? 'border-purple-200 dark:border-purple-800' : 
            'border-gray-200 dark:border-gray-700'}`;
  }

  // Métodos para análisis de nivel
  getLevelAnalysis(level: string): { title: string; description: string; recommendation: string; } {
    const details = this.levelDetails().find(d => d.level === level);
    const ranking = this.levelRankingInfo().find(r => r.level === level);
    
    if (!details) {
      return {
        title: 'Sin datos suficientes',
        description: 'No hay suficientes tests completados en este nivel para realizar un análisis.',
        recommendation: 'Realiza más tests en este nivel para obtener estadísticas más precisas.'
      };
    }
    
    const accuracy = details.all_attempts.accuracy;
    const percentile = ranking?.percentile || 0;
    
    if (accuracy >= 80 && percentile >= 80) {
      return {
        title: 'Excelente rendimiento',
        description: `Tu precisión del ${accuracy.toFixed(1)}% te coloca en el top ${percentile}% de usuarios en este nivel.`,
        recommendation: 'Considera avanzar a niveles más difíciles o enfocarte en mejorar tu velocidad.'
      };
    } else if (accuracy >= 70 && percentile >= 60) {
      return {
        title: 'Buen rendimiento',
        description: `Tu precisión del ${accuracy.toFixed(1)}% es sólida. Estás por encima del promedio de usuarios.`,
        recommendation: 'Enfócate en mantener la consistencia y reducir el tiempo por pregunta.'
      };
    } else if (accuracy >= 60) {
      return {
        title: 'Rendimiento adecuado',
        description: `Tu precisión del ${accuracy.toFixed(1)}% es aceptable, pero hay margen de mejora.`,
        recommendation: 'Practica más en este nivel y revisa los conceptos donde tengas más errores.'
      };
    } else {
      return {
        title: 'Necesita mejorar',
        description: `Tu precisión del ${accuracy.toFixed(1)}% está por debajo del promedio recomendado.`,
        recommendation: 'Revisa los conceptos básicos de este nivel y practica con tests específicos.'
      };
    }
  }

  // Método para obtener la tendencia de mejora
  getImprovementTrend(level: string): 'up' | 'down' | 'stable' {
    const details = this.levelDetails().find(d => d.level === level);
    if (!details) return 'stable';
    
    const accuracyDiff = details.improvement_rate.accuracy;
    const timeDiff = details.improvement_rate.time;
    
    if (accuracyDiff > 5 && timeDiff < 0) {
      return 'up'; // Mejora en precisión y velocidad
    } else if (accuracyDiff > 2 || timeDiff < -5) {
      return 'up'; // Mejora significativa en al menos un aspecto
    } else if (accuracyDiff < -2 || timeDiff > 5) {
      return 'down'; // Empeoramiento
    } else {
      return 'stable'; // Estable
    }
  }

  // Método para obtener el nivel más jugado
  getMostPlayedLevel(): string | null {
    const distribution = this.levelDistribution();
    if (!distribution.length) return null;
    
    return distribution[0].level;
  }

  // Método para obtener el nivel con mejor precisión
  getBestAccuracyLevel(): string | null {
    const progress = this.levelProgress();
    if (!progress.length) return null;
    
    return progress.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    ).level;
  }

  // Método para obtener el nivel más rápido
  getFastestLevel(): string | null {
    const progress = this.levelProgress();
    if (!progress.length) return null;
    
    return progress.reduce((fastest, current) => 
      current.average_time < fastest.average_time ? current : fastest
    ).level;
  }

  // Método para formatear estadísticas de nivel para tarjetas
  getLevelCardStats(level: string): any {
    const progress = this.levelProgress().find(p => p.level === level);
    const ranking = this.levelRankingInfo().find(r => r.level === level);
    const comparison = this.levelComparisons()?.[level];
    
    return {
      progress,
      ranking,
      comparison,
      trend: this.getImprovementTrend(level),
      analysis: this.getLevelAnalysis(level)
    };
  }

  // Método para alternar la visibilidad de detalles de nivel
  toggleLevelDetails(level?: string): void {
    if (level) {
      this.setLevelDetailTab(level);
    }
    this.showLevelDetails.set(!this.showLevelDetails());
  }

  // Método para refrescar todos los datos
  refreshAllData(): void {
    this.loadDashboardData(true);
    if (this.showRankings()) {
      this.loadRankingsData();
    }
  }

  // Método para obtener estadísticas de la semana
  getWeeklyProgress(): any {
    // Este método puede implementarse cuando tengas datos históricos
    return {
      testsCompleted: 0,
      accuracyChange: 0,
      timeChange: 0,
      levelProgress: {}
    };
  }

  // Método para exportar datos
  exportDashboardData(): void {
    const data = {
      dashboard: this.dashboardData(),
      rankings: this.rankingsData(),
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Nuevos métodos específicos para la nueva estructura de datos

  // Obtener el valor del usuario actual para el ranking activo
  getCurrentUserValueForActiveTab(): number | null {
    const personalStats = this.personalStats();
    if (!personalStats) return null;

    switch(this.activeRankingTab()) {
      case 'tests':
        return personalStats.tests_completed;
      case 'time_all':
        return personalStats.average_time_per_question;
      case 'time_first':
        return personalStats.average_time_per_question_first_attempt;
      case 'accuracy_all':
        return personalStats.average_score;
      case 'accuracy_first':
        return personalStats.average_score_first_attempt;
      case 'questions':
        return personalStats.total_questions_answered;
      default:
        return null;
    }
  }

  // Obtener la posición del usuario para el ranking activo
  getCurrentUserPositionForActiveTab(): number | null {
    const position = this.currentUserPosition();
    if (!position) return null;

    switch(this.activeRankingTab()) {
      case 'tests':
        return position.tests;
      case 'time_all':
        return position.avg_time_per_question_all;
      case 'time_first':
        return position.avg_time_per_question_first;
      case 'accuracy_all':
        return position.accuracy_all;
      case 'accuracy_first':
        return position.accuracy_first;
      case 'questions':
        return position.questions_answered;
      default:
        return null;
    }
  }

  // Calcular el top porcentaje para una posición
  calculateTopPercentage(position: number): number {
    const total = this.totalActiveUsers();
    if (total === 0) return 0;
    return ((position / total) * 100);
  }

  // Verificar si el usuario está en el top 5
  isUserInTop5(): boolean {
    const position = this.getCurrentUserPositionForActiveTab();
    return position !== null && position <= 5;
  }

  // Obtener el ranking donde está el usuario
  getCurrentUserRankingItem(): RankingItem | null {
    const currentRankings = this.currentRankings();
    
    if (!this.currentUser || !currentRankings) return null;
    
    return currentRankings.find(item => item.user_id === this.currentUser?.id) || null;
  }

  // Método para formatear el valor de un ranking item
  formatRankingItemValue(item: RankingItem): string {
    const category = this.getRankingTabLabel(this.activeRankingTab());
    return this.formatRankingValue(item.value, category);
  }

  // Obtener estadísticas resumidas para un nivel
  getLevelSummary(level: string): any {
    const stats = this.levelStats()?.[level];
    if (!stats) return null;

    return {
      tests: stats.all_attempts.tests_count,
      accuracy: stats.all_attempts.average_score,
      time: stats.all_attempts.average_time_per_question,
      questions: stats.all_attempts.questions_count,
      correct: stats.all_attempts.total_correct,
      incorrect: stats.all_attempts.total_incorrect
    };
  }

  // Verificar si hay datos suficientes para mostrar
  hasEnoughData(): boolean {
    const stats = this.personalStats();
    return !!(stats && stats.tests_completed > 0);
  }

  // Obtener el nivel con más tests completados
  getMostActiveLevel(): string | null {
    const distribution = this.levelDistribution();
    if (!distribution.length) return null;
    
    return distribution.reduce((most, current) => 
      current.tests > most.tests ? current : most
    ).level;
  }

  // Obtener el nivel con mejor tiempo promedio
  getFastestAverageLevel(): string | null {
    const details = this.levelDetails();
    if (!details.length) return null;
    
    return details.reduce((fastest, current) => 
      current.all_attempts.time < fastest.all_attempts.time ? current : fastest
    ).level;
  }

  // Calcular el progreso general del usuario
  getOverallProgress(): number {
    const progress = this.levelProgress();
    if (!progress.length) return 0;
    
    const totalCompletion = progress.reduce((sum, level) => sum + level.completion_percentage, 0);
    return totalCompletion / progress.length;
  }
}
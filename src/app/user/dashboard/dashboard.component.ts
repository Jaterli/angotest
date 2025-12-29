import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../shared/services/auth.service';
import { DashboardService } from '../../shared/services/user-dashboard.service';
import { DashboardData, RankingsData } from '../../shared/models/user-dashboard.model';

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
  `]
})
export class DashboardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);

  // Signals
  dashboardData = signal<DashboardData | null>(null);
  rankingsData = signal<RankingsData | null>(null);
  loading = signal(false);
  rankingsLoading = signal(false);
  error = signal<string | null>(null);
  showRankings = signal(false);
  lastUpdated = signal<string>('');

  // Computed signals
  personalStats = computed(() => this.dashboardData()?.personal_stats);
  rankingStats = computed(() => this.dashboardData()?.ranking_stats);
  timeStats = computed(() => this.dashboardService.getFormattedTimeStats(this.personalStats()!));
  accuracyStats = computed(() => this.dashboardService.getAccuracyStats(this.personalStats()!));
  rankingPositions = computed(() => this.dashboardService.getRankingPositions(this.rankingStats()!));
  
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
    return stats.average_time_first - stats.average_time;
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

    this.dashboardService.getRankings(10)
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

  formatTimeDifference(difference: number): string {
    const absDiff = Math.abs(difference);
    const formatted = this.formatTime(absDiff);
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
      case 'Tests Completados': return '#3b82f6'; // blue-500
      case 'Tiempo Promedio': return '#10b981'; // emerald-500
      case 'Primera Versión': return '#f59e0b'; // amber-500
      default: return '#6b7280'; // gray-500
    }
  }

  getPercentileColor(percentile: number): string {
    if (percentile >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (percentile >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentile >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
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
}
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/components/modal.component';
import { DashboardService } from '../../services/dashboard.service';
import { TestStatsModalService } from '../../services/test-stats-modal.service';
import { TestDetailedStats } from '../../models/admin-dashboard.models';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

@Component({
  selector: 'app-test-stats-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './test-stats-modal.component.html'
})
export class TestStatsModalComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private modalService = inject(TestStatsModalService);
  private sharedUtilsService = inject(SharedUtilsService);
  private subscription?: Subscription;

  // Propiedades del modal
  isOpen = false;
  title = 'Estadísticas Detalladas del Test';
  testId: number | null = null;

  // Datos
  stats = signal<TestDetailedStats | null>(null);
  
  isLoading = signal(true);
  error: string | null = null;

  ngOnInit() {
   
    // Suscribirse a los cambios del servicio
    this.subscription = this.modalService.modalState$.subscribe(state => {
      this.isOpen = state.isOpen;
      
      if (state.isOpen && state.testId) {
        this.testId = state.testId;
        this.loadStats(state.testId);
      } else {
        this.resetModal();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  closeModal(): void {
    this.modalService.close();
  }

  private resetModal(): void {
    this.stats.set(null);
    this.isLoading.set(false);
    this.error = null;
    this.testId = null;
  }

  private loadStats(testId: number): void {
    this.isLoading.set(true);
    this.error = null;
    this.stats.set(null);

    this.dashboardService.getTestStats(testId).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error = 'No se pudieron cargar las estadísticas del test.';
        this.isLoading.set(false);
      }
    });
  }

  abandonedAttempts(): number {
    if (!this.stats()) return 0;
    return this.stats()!.total_attempts - (this.stats()!.completed_attempts + this.stats()!.in_progress_attempts);
  }

  abandonmentRate(): number {
    if (!this.stats()) return 0;
    const abandoned = this.stats()!.total_attempts - (this.stats()!.completed_attempts + this.stats()!.in_progress_attempts);
    return (abandoned / this.stats()!.total_attempts) * 100;
  }

  // Helper methods
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }

  formatPercentage(value: number): string {
    return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
  }

  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  getProgressColor(percentage: number): string {
    return this.sharedUtilsService.getSharedProgressColor(percentage);
  }
}
// components/user-stats-modal.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/components/modal.component';
import { DashboardService } from '../../services/dashboard.service';
import { UserStatsModalService } from '../../services/user-stats-modal.service';
import { UserDetailedStats } from '../../models/admin-dashboard.models';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

@Component({
  selector: 'app-user-stats-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './user-stats-modal.component.html'
})
export class UserStatsModalComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);


  private modalService = inject(UserStatsModalService);
  private sharedUtilsService = inject(SharedUtilsService);
  private subscription?: Subscription;



  // Propiedades del modal
  isOpen = false;
  title = 'Estadísticas Detalladas del Usuario';
  userId: number | null = null;

  // Datos
  stats = signal<UserDetailedStats | null>(null);

  isLoading = signal(true);
  error: string | null = null;

  ngOnInit() {   
    // Suscribirse a los cambios del servicio
    this.subscription = this.modalService.modalState$.subscribe(state => {
      this.isOpen = state.isOpen;

      if (state.isOpen && state.userId) {
        this.userId = state.userId;
        this.loadStats(state.userId);
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
    this.userId = null;
  }

  private loadStats(userId: number): void {
    this.isLoading.set(true);
    this.error = null;
    this.stats.set(null);

    this.dashboardService.getUserStats(userId).subscribe({
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

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  getRoleColor(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  }

  getLevelColor(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getLastLoginClass(lastLogin: string): string {
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    } else if (diffDays <= 7) {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    }
  }

  getLastLoginStatus(lastLogin: string): string {
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Hace ${diffMinutes} min`;
      }
      return `Hace ${diffHours} h`;
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
    }
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  getProgressColor(percentage: number): string {
    return this.sharedUtilsService.getSharedProgressColor(percentage);
  }

  getActivityStatusColor(status: string): string {
    return this.sharedUtilsService.getSharedActivityStatusBgColor(status);  
  }

}
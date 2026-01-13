// admin-dashboard.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponse, DashboardFilters } from '../models/dashboard.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Datos del dashboard
  dashboardData = signal<DashboardResponse | null>(null);
  
  // Estados de carga
  isLoading = signal(true);
  activeTab = signal<'overview' | 'tests' | 'users'>('overview');
  
  // Filtros
  filters = signal<DashboardFilters>({
    months_back: 6,
    limit: 10,
    active_threshold: 10
  });
  
  // Opciones de filtro
  monthsBackOptions = [1, 3, 6, 12];
  limitOptions = [5, 10, 20, 50];
  activeThresholdOptions = [1, 3, 5, 10, 15, 20];
  
  // Manejo de errores
  errorMessage = signal('');
  showErrorModal = signal(false);

  ngOnInit() {
    this.loadDashboard();
  }

  // Cargar dashboard
  loadDashboard(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getDashboard(this.filters()).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.errorMessage.set('Error al cargar el dashboard de administración');
        this.showErrorModal.set(true);
        this.isLoading.set(false);
      }
    });
  }

  // Actualizar filtros
  updateFilters(key: keyof DashboardFilters, value: any): void {
    const currentFilters = this.filters();
    this.filters.set({ ...currentFilters, [key]: value });
  }

  // Cambiar pestaña
  setActiveTab(tab: 'overview' | 'tests' | 'users'): void {
    this.activeTab.set(tab);
  }

  // Aplicar filtros
  applyFilters(): void {
    this.loadDashboard();
  }

  // Reiniciar filtros
  resetFilters(): void {
    this.filters.set({
      months_back: 6,
      limit: 10,
      active_threshold: 10
    });
    this.applyFilters();
  }

  // Helper methods
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getDateAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  // getScoreBgColor(percentage: number): string {
  //   return this.sharedUtilsService.getSharedScoreBgColor(percentage);
  // }

  // Cerrar modal de error
  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }

  // Helper para ordenar arrays por fecha
  sortByDate<T extends { date: string }>(items: T[], ascending: boolean = true): T[] {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  // Helper para calcular porcentajes
  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return (part / total) * 100;
  }
}

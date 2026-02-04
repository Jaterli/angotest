// admin-dashboard.component.ts
import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponse, DashboardFilters } from '../models/admin-dashboard.models';
import { TestStatsModalComponent } from '../tests/test-stats-modal/test-stats-modal.component';
import { TestStatsModalService } from '../services/test-stats-modal.service';
import { IdWithStatsButtonComponent } from '../shared-components/id-with-stats-button.component';
import { UserStatsModalComponent } from '../user/user-stats-modal/user-stats-modal.component';
import { UserStatsModalService } from '../services/user-stats-modal.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TestStatsModalComponent, IdWithStatsButtonComponent, UserStatsModalComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sharedUtilsService = inject(SharedUtilsService);

  constructor(private testStatsModalService: TestStatsModalService, private userStatsModalService: UserStatsModalService) {}


  // Datos del dashboard
  dashboardData = signal<DashboardResponse | null>(null);
  
  // Estados de carga
  isLoading = signal(true);
  activeTab = signal<'overview' | 'tests' | 'users'>('overview');
  
  // Filtros
  filters = signal<DashboardFilters>({
    months_back: 6,
    limit: 10,
  });
  
  // Opciones de filtro
  monthsBackOptions = [1, 3, 6, 12];
  limitOptions = [5, 10, 20, 50];

  // Para el modal de estadísticas de test
  selectedTestId: number | null = null;

  // Para el modal de estadísticas de usuario
  selectedUserId: number | null = null;

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

  openTestStats(testId: number): void {
    this.testStatsModalService.open(testId);
  }

  openUserStats(userId: number): void {
    this.userStatsModalService.open(userId);
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
    });
    this.applyFilters();
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

  getDateAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

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
    return this.sharedUtilsService.sharedCalculatePercentage(part, total);
  }

}

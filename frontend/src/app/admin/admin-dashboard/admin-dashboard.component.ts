// admin-dashboard.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponse, DashboardFilters } from '../models/admin-dashboard.models';
import { TestStatsModalComponent } from '../tests/test-stats-modal/test-stats-modal.component';
import { TestStatsModalService } from '../services/test-stats-modal.service';
import { IdWithIconButtonComponent } from '../shared-components/id-with-icon-button.component';
import { UserStatsModalComponent } from '../user/user-stats-modal/user-stats-modal.component';
import { UserModalService } from '../services/user-modal.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TestStatsModalComponent, IdWithIconButtonComponent, UserStatsModalComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sharedUtilsService = inject(SharedUtilsService);

  constructor(private testStatsModalService: TestStatsModalService, private userModalService: UserModalService) {}

  // Datos del dashboard
  dashboardData = signal<DashboardResponse | null>(null);
  
  // Estados de carga
  isLoading = signal(true);
  activeTab = signal<'overview' | 'tests' | 'users'>('overview');
  
  // Control de visibilidad de filtros
  showFilters = signal(false);
  
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

  // Clave para localStorage
  private readonly FILTER_STORAGE_KEY = 'dashboard_filters';
  private readonly FILTER_VISIBILITY_KEY = 'dashboard_filters_visible';

  ngOnInit() {
    this.loadSavedFilters();
    this.loadSavedFilterVisibility();
    this.loadDashboard();
  }

  // Cargar filtros guardados
  loadSavedFilters(): void {
    try {
      const savedFilters = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        // Asegurar que solo se carguen propiedades válidas
        const validFilters: DashboardFilters = {
          months_back: filters.months_back || 6,
          limit: filters.limit || 10,
        };
        this.filters.set(validFilters);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  // Guardar filtros en localStorage
  saveFilters(): void {
    const filters = {
      ...this.filters(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }

  // Cargar visibilidad de filtros
  loadSavedFilterVisibility(): void {
    try {
      const savedVisibility = localStorage.getItem(this.FILTER_VISIBILITY_KEY);
      if (savedVisibility !== null) {
        this.showFilters.set(JSON.parse(savedVisibility));
      }
    } catch (error) {
      console.error('Error loading filter visibility:', error);
    }
  }

  // Guardar visibilidad de filtros
  saveFilterVisibility(): void {
    localStorage.setItem(this.FILTER_VISIBILITY_KEY, JSON.stringify(this.showFilters()));
  }

  // Toggle visibilidad de filtros
  toggleFilters(): void {
    this.showFilters.update(value => !value);
    this.saveFilterVisibility();
  }

  // Cargar dashboard
  loadDashboard(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getDashboard(this.filters()).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
        this.saveFilters(); // Guardar filtros después de cargar exitosamente
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
    this.userModalService.open(userId);
  }

  // Actualizar filtros
  updateFilters(key: keyof DashboardFilters, value: any): void {
    const currentFilters = this.filters();
    this.filters.set({ ...currentFilters, [key]: value });
    // No guardamos automáticamente aquí, solo cuando se aplican
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
    this.saveFilters(); // Guardar los filtros por defecto
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

  getRoleBadgeClass(role: string): string { 
    return this.sharedUtilsService.getSharedRoleBadgeClass(role);
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
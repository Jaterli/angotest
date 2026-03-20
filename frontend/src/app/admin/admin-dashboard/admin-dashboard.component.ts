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
import { SystemConfigService } from '../services/system-config.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TestStatsModalComponent, IdWithIconButtonComponent, UserStatsModalComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private systemConfigService = inject(SystemConfigService);
  private sharedUtilsService = inject(SharedUtilsService);

  constructor(private testStatsModalService: TestStatsModalService, private userModalService: UserModalService) {}

  // Datos del dashboard
  dashboardData = signal<DashboardResponse | null>(null);
  
  // Estados de carga
  isLoading = signal(true);
  activeTab = signal<'overview' | 'tests' | 'users'>('overview');
  
  // Control de visibilidad de filtros
  showFilters = signal(false);
  
  // Filtros - Modificado para rango de fechas
  filters = signal<DashboardFilters>({
    start_date: this.getDefaultStartDate(), // 6 meses atrás por defecto
    end_date: this.getTodayDate(), // Hoy por defecto
    limit: 10,
  });
  
  // Opciones de filtro
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

  expiredDays = toSignal(
    this.systemConfigService.getByKey("mark_in_progress_as_expired_after_days")
  );

  ngOnInit() {
    this.loadSavedFilters();
    this.loadSavedFilterVisibility();
    this.loadDashboard();
  }

  // Método helper para obtener fecha por defecto (6 meses atrás)
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return this.formatDateForInput(date);
  }

  // Método helper para obtener fecha actual
  getTodayDate(): string {
    return this.formatDateForInput(new Date());
  }

  // Formatear fecha para input type="date" (YYYY-MM-DD)
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Convertir fecha de input a formato para backend (opcional, si necesitas formato específico)
  private formatDateForBackend(dateStr: string): string {
    // Si el backend espera formato diferente, ajusta aquí
    return dateStr; // Por ahora mantengo YYYY-MM-DD
  }

  // Cargar filtros guardados
  loadSavedFilters(): void {
    try {
      const savedFilters = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        // Asegurar que solo se carguen propiedades válidas
        const validFilters: DashboardFilters = {
          start_date: filters.start_date || this.getDefaultStartDate(),
          end_date: filters.end_date || this.getTodayDate(),
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
    
    // Validar que las fechas sean válidas
    const filters = this.filters();
    if (filters.start_date && filters.end_date) {
      if (new Date(filters.start_date) > new Date(filters.end_date)) {
        this.errorMessage.set('La fecha de inicio no puede ser mayor que la fecha de fin');
        this.showErrorModal.set(true);
        this.isLoading.set(false);
        return;
      }
    }
    
    this.dashboardService.getDashboard(filters).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
        this.saveFilters();
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
      start_date: this.getDefaultStartDate(),
      end_date: this.getTodayDate(),
      limit: 10,
    });
    this.saveFilters();
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

  // Método actualizado para mostrar el rango de fechas
  getDateRangeText(): string {
    const filters = this.filters();
    if (filters.start_date && filters.end_date) {
      const startDate = new Date(filters.start_date).toLocaleDateString('es-ES');
      const endDate = new Date(filters.end_date).toLocaleDateString('es-ES');
      return `${startDate} - ${endDate}`;
    }
    return 'Rango de fechas no definido';
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

  // Atajos de fechas
  setLastWeek(): void {
    const endDate = this.getTodayDate();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    this.filters.update(filters => ({
      ...filters,
      start_date: this.formatDateForInput(startDate),
      end_date: endDate
    }));
    this.applyFilters();
  }

  setLastMonth(): void {
    const endDate = this.getTodayDate();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    this.filters.update(filters => ({
      ...filters,
      start_date: this.formatDateForInput(startDate),
      end_date: endDate
    }));
    this.applyFilters();
  }

  setLastQuarter(): void {
    const endDate = this.getTodayDate();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    
    this.filters.update(filters => ({
      ...filters,
      start_date: this.formatDateForInput(startDate),
      end_date: endDate
    }));
    this.applyFilters();
  }

  // Validación de fechas
  validateDates(): boolean {
    const filters = this.filters();
    if (!filters.start_date || !filters.end_date) {
      this.errorMessage.set('Debe seleccionar ambas fechas');
      this.showErrorModal.set(true);
      return false;
    }
    
    const start = new Date(filters.start_date);
    const end = new Date(filters.end_date);
    
    if (start > end) {
      this.errorMessage.set('La fecha de inicio no puede ser mayor que la fecha de fin');
      this.showErrorModal.set(true);
      return false;
    }
    
    return true;
  }
}
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/results-management.service';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { AdminResultResponse, AdminResultsFilter } from '../models/admin-results.models';

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-results.component.html',
})
export class AdminResultsComponent implements OnInit {
  private adminService = inject(AdminService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Resultados y estado
  adminResultsData = signal<AdminResultResponse[]>([]);
  loading = signal(true);
  
  // Filtros
  selectedFilters = signal<AdminResultsFilter>({
    page: 1,
    page_size: 20
  });
  
  // Opciones de filtros
  availableFilters = signal<{
    main_topics: string[];
    levels: string[];
    statuses: string[];
    roles: string[];
  }>({
    main_topics: [],
    levels: [],
    statuses: [],
    roles: ['user', 'admin']
  });
  
  // Ordenamiento
  sortOptions = [
    { value: 'updated_at', label: 'Última actualización' },
    { value: 'started_at', label: 'Fecha de inicio' },
    { value: 'score', label: 'Puntuación' },
    { value: 'time_taken', label: 'Tiempo empleado' },
    { value: 'correct_answers', label: 'Respuestas correctas' },
    { value: 'user_username', label: 'Usuario' },
    { value: 'test_title', label: 'Título del test' },
    { value: 'test_main_topic', label: 'Tema principal' },
    { value: 'test_level', label: 'Nivel del test' }
  ];
  
  // Paginación
  currentPage = signal(1);
  totalResults = signal(0);
  totalResultsWithFilters = signal(0);
  totalPages = signal(0);  
  hasMore = signal(false);
  
  // Estado de la UI
  showFilters = signal(true);
  showAdvancedFilters = signal(false);
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'admin_results_filters';
  
  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadResults();
  }

  loadSavedFilters(): void {
    try {
      const savedFilters = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        this.selectedFilters.set({ ...this.selectedFilters(), ...filters });
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  saveFilters(): void {
    const filters = {
      ...this.selectedFilters(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }

  loadResults(): void {
    this.loading.set(true);
    
    this.adminService.getAdminResults(this.selectedFilters()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.adminResultsData.set(res.data.results);
          this.totalResults.set(res.stats.total_results);
          this.totalResultsWithFilters.set(res.stats.total_results_with_filters);
          this.currentPage.set(res.data.current_page);          
          this.totalPages.set(Math.ceil(res.stats.total_results_with_filters / (this.selectedFilters().page_size || 20)));
          this.hasMore.set(this.currentPage() < this.totalPages());
          
          // Actualizar filtros disponibles
          if (res.data.available_filters) {
            this.availableFilters.set(res.data.available_filters);
          }
          
          this.loading.set(false);
          this.saveFilters();
        }
      },
      error: (err) => {
        console.error('Error al cargar resultados administrativos:', err);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros
  onFilterChange(): void {
    // Resetear a página 1 cuando cambian los filtros
    this.selectedFilters.update(filters => ({ ...filters, page: 1 }));
    this.currentPage.set(1);
    this.loadResults();
  }

  resetFilters(): void {
    this.selectedFilters.set({
      page: 1,
      page_size: 20,
      sort_by: 'updated_at',
      sort_order: 'desc',
      status: '',
      test_main_topic: '',
      test_level: '',
      user_role: ''

    });
    this.currentPage.set(1);
    this.loadResults();
  }

  updateFilter<T extends keyof AdminResultsFilter>(key: T, value: AdminResultsFilter[T]): void {
    this.selectedFilters.update(filters => ({ ...filters, [key]: value }));
    if (key !== 'page') {
      this.onFilterChange();
    }
    // Nota: cuando key es 'page', se maneja en goToPage()
  }

  removeFilter(key: keyof AdminResultsFilter): void {
    this.updateFilter(key, '');
    this.onFilterChange();
  }

  // Métodos para ordenamiento
  toggleSortOrder(): void {
    const currentOrder = this.selectedFilters().sort_order || 'desc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    this.updateFilter('sort_order', newOrder);
  }

  setSortBy(sortBy: string): void {
    this.updateFilter('sort_by', sortBy);
  }

  // Métodos para paginación CORREGIDOS
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    
    this.currentPage.set(page);
    // Actualizar filtros y cargar resultados
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadResults(); // ¡Esta es la línea clave!
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.goToPage(newPage);
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      const newPage = this.currentPage() + 1;
      this.goToPage(newPage);
    }
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(this.totalPages(), this.currentPage());
  }

  // Métodos de utilidad
  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getStatusBadgeClass(status: string): string {
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
}

  getStatusLabel(status: string): string {
    return this.sharedUtilsService.getSharedStatusLabel(status);
  }

  getScoreBadgeClass(score: number): string {
    return this.sharedUtilsService.getSharedScoreBadgeClass(score);
  }

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  formatTimeShort(dateString: string): string {
    return this.sharedUtilsService.sharedFormatTimeShort(dateString);
  }

  // Métodos específicos para UI
  getCurrentSortLabel(): string {
    const sortBy = this.selectedFilters().sort_by || 'updated_at';
    const option = this.sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Última actualización';
  }

  getSortOrderIcon(): string {
    const order = this.selectedFilters().sort_order || 'desc';
    return order === 'asc' ? '↑' : '↓';
  }

  showFilterIndicators(): boolean {
    const filters = this.selectedFilters();
    return !!(filters.user_role || 
               filters.test_main_topic || 
               filters.test_level || 
               filters.status ||
               filters.min_score !== undefined ||
               filters.max_score !== undefined ||
               filters.start_date ||
               filters.end_date ||
               filters.search);
  }

  showPagination(): boolean {
    return this.totalResults() > 0 && this.totalPages() > 1;
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * (this.selectedFilters().page_size || 20)) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * (this.selectedFilters().page_size || 20), this.totalResultsWithFilters());
  }

  // Método para exportar resultados (opcional)
  exportResults(): void {
    // Implementación para exportar a CSV o Excel
    console.log('Exportando resultados...');
    // this.adminService.exportResults(this.selectedFilters()).subscribe(...);
  }

  // Método para ver detalles del resultado
  viewResultDetails(resultId: number): void {
    // Navegar a página de detalles del resultado
    // this.router.navigate(['/admin/results', resultId]);
  }

  // Método para formatear nombre de usuario
  getUserFullName(result: AdminResultResponse): string {
    if (result.user_first_name && result.user_last_name) {
      return `${result.user_first_name} ${result.user_last_name}`;
    }
    return result.user_username;
  }
}
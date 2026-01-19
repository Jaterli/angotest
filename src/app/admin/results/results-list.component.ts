import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResultsManagementService } from '../services/results-management.service';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { AdminResultResponse, AdminResultsFilter } from '../models/results-list.models';
import { ModalComponent } from '../../shared/components/modal.component';
import { UserResultDetailsModalComponent } from '../user/user-result-details-modal/user-result-details-modal.component';
import { UserResultDetailsModalService } from '../services/user-result-details-modal.service';

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, UserResultDetailsModalComponent], 
  templateUrl: './results-list.component.html',
})
export class ResultsListComponent implements OnInit {
  private resultsManagementService = inject(ResultsManagementService);
  private sharedUtilsService = inject(SharedUtilsService);
  private resultDetailsModalService = inject(UserResultDetailsModalService);

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
  
 
  // Paginación
  currentPage = signal(1);
  totalFilteredResults = signal(0);
  totalResults = signal(0);
  totalPages = signal(0);  
  hasMore = signal(false);
  
  // Estado de la UI
  showFilters = signal(true);
  showAdvancedFilters = signal(false);

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
  

  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'admin_results_filters';
  
  // --- SEÑALES PARA ELIMINACIÓN MASIVA ---
  
  // Resultados seleccionados
  selectedResults = signal<Set<number>>(new Set());
  
  // Estado de selección
  isAllSelected = signal(false);
  isIndeterminate = signal(false);
  
  // Modales
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  deleteInProgress = signal(false);
  
  // Resultado individual para eliminar
  resultToDelete = signal<AdminResultResponse | null>(null);
  
  // Contador para resultados seleccionados
  selectedCount = signal(0);
  
  // Mensajes del modal
  modalTitle = signal('');
  modalMessage = signal('');
  
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
    
    this.resultsManagementService.getAdminResults(this.selectedFilters()).subscribe({
      next: (res) => {
        this.adminResultsData.set(res.results);
        this.totalFilteredResults.set(res.stats.total_filtered_results);
        this.totalResults.set(res.stats.total_results);
        //this.currentPage.set(res.filters_applied.CurrentPage);          
        this.totalPages.set(Math.ceil(res.stats.total_filtered_results / (this.selectedFilters().page_size || 20)));
        this.hasMore.set(this.currentPage() < this.totalPages());
        
        // Actualizar filtros disponibles
        if (res.available_filters) {
          this.availableFilters.set(res.available_filters);
        }
        
        this.loading.set(false);
        this.saveFilters();
        
        // Resetear selección después de cargar nuevos resultados
        this.clearSelection();
        
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
    console.log("Filtros cambiados");
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
  }

  removeFilter(key: keyof AdminResultsFilter): void {
    this.updateFilter(key, undefined);
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

  // Métodos para paginación
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    console.log("Yendo a página: ",page);
    this.currentPage.set(page);
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadResults();
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

  // Método para mostrar detalles usando el servicio
  showResultDetails(result: AdminResultResponse): void {
    if (!result.user_id) return;
    
    this.resultDetailsModalService.open(result.user_id, result.id);
  }


  // --- MÉTODOS PARA ELIMINACIÓN MASIVA ---

  // Métodos de selección
  toggleResultSelection(resultId: number): void {
    const selected = this.selectedResults();
    if (selected.has(resultId)) {
      selected.delete(resultId);
    } else {
      selected.add(resultId);
    }
    this.selectedResults.set(new Set(selected));
    this.updateSelectionState();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      const allIds = this.adminResultsData().map(result => result.id);
      this.selectedResults.set(new Set(allIds));
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    }
    this.updateSelectedCount();
  }

  clearSelection(): void {
    this.selectedResults.set(new Set());
    this.isAllSelected.set(false);
    this.isIndeterminate.set(false);
    this.updateSelectedCount();
  }

  updateSelectionState(): void {
    const totalItems = this.adminResultsData().length;
    const selectedCount = this.selectedResults().size;
    
    if (selectedCount === 0) {
      this.isAllSelected.set(false);
      this.isIndeterminate.set(false);
    } else if (selectedCount === totalItems) {
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    } else {
      this.isAllSelected.set(false);
      this.isIndeterminate.set(true);
    }
    
    this.updateSelectedCount();
  }

  updateSelectedCount(): void {
    this.selectedCount.set(this.selectedResults().size);
  }

  // Métodos para eliminar
  confirmDeleteResult(result: AdminResultResponse): void {
    this.resultToDelete.set(result);
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar el resultado del usuario "${this.getUserFullName(result)}" en el test "${result.test_title}"? Esta acción no se puede deshacer.`);
    this.showDeleteModal.set(true);
  }

  confirmBulkDelete(): void {
    if (this.selectedCount() === 0) return;
    
    this.modalTitle.set('Confirmar eliminación masiva');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar ${this.selectedCount()} resultado(s) seleccionado(s)? Esta acción no se puede deshacer.`);
    this.showBulkDeleteModal.set(true);
  }

  deleteResult(): void {
    const result = this.resultToDelete();
    if (!result) return;
    
    this.deleteInProgress.set(true);
    
    this.resultsManagementService.deleteResult(result.id).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.adminResultsData.update(results => 
          results.filter(r => r.id !== result.id)
        );
        
        // Actualizar contadores
        this.totalFilteredResults.update(count => count - 1);
        
        // Cerrar modal y resetear estado
        this.showDeleteModal.set(false);
        this.resultToDelete.set(null);
        this.deleteInProgress.set(false);
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage(`Resultado eliminado correctamente.`);
      },
      error: (err) => {
        console.error('Error al eliminar resultado:', err);
        this.deleteInProgress.set(false);
        this.showErrorMessage('Error al eliminar el resultado. Por favor, inténtalo de nuevo.');
      }
    });
  }

  deleteSelectedResults(): void {
    const selectedIds = Array.from(this.selectedResults());
    if (selectedIds.length === 0) return;
    
    this.deleteInProgress.set(true);
    
    this.resultsManagementService.deleteResultsBulk(selectedIds).subscribe({
      next: (response) => {
        // Eliminar de la lista local
        this.adminResultsData.update(results => 
          results.filter(r => !selectedIds.includes(r.id))
        );
        
        // Actualizar contadores
        this.totalFilteredResults.update(count => count - selectedIds.length);
        
        // Limpiar selección
        this.clearSelection();
        
        // Cerrar modal
        this.showBulkDeleteModal.set(false);
        this.deleteInProgress.set(false);
        
        // Mostrar mensaje de éxito
        this.showSuccessMessage(`${selectedIds.length} resultado(s) eliminado(s) correctamente.`);
        
        // Si la página queda vacía y hay páginas anteriores, volver a la anterior
        if (this.adminResultsData().length === 0 && this.currentPage() > 1) {
          this.goToPage(this.currentPage() - 1);
        }
      },
      error: (err) => {
        console.error('Error al eliminar resultados:', err);
        this.deleteInProgress.set(false);
        this.showErrorMessage('Error al eliminar los resultados. Por favor, inténtalo de nuevo.');
      }
    });
  }

  // Métodos para mostrar mensajes
  showSuccessMessage(message: string): void {
    // Puedes implementar un toast o alert aquí
    alert(message); // Temporal - considera usar un servicio de notificaciones
  }

  showErrorMessage(message: string): void {
    alert(message); // Temporal - considera usar un servicio de notificaciones
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
    return this.totalFilteredResults() > 0 && this.totalPages() > 1;
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * (this.selectedFilters().page_size || 20)) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * (this.selectedFilters().page_size || 20), this.totalFilteredResults());
  }

  // Método para exportar resultados
  exportResults(): void {
    console.log('Exportando resultados...');
  }

  // Método para ver detalles del resultado
  viewResultDetails(resultId: number): void {
    // Navegar a página de detalles del resultado
  }

  // Método para formatear nombre de usuario
  getUserFullName(result: AdminResultResponse): string {
    if (result.user_first_name && result.user_last_name) {
      return `${result.user_first_name} ${result.user_last_name}`;
    }
    return result.user_username;
  }
}
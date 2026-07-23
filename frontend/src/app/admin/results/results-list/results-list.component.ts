import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ResultsManagementService } from '../../services/results-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { AdminResult, AdminResultsFilter, AdminResultsResponse, ResultsAvailableFilters, ResultsStats } from '../../models/results-list.models';
import { ModalComponent } from '../../../shared/components/modal.component';
import { ResultUserDetailsModalComponent } from '../result-user-details-modal/result-user-details-modal.component';
import { ResultUserDetailsModalService } from '../../services/result-user-details-modal.service';

type DeleteModalState = 
  | { type: 'none' }
  | { type: 'single'; result: AdminResult }
  | { type: 'bulk'; count: number };

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, ResultUserDetailsModalComponent],
  templateUrl: './results-list.component.html',
})
export class ResultsListComponent implements OnInit {
  private resultsManagementService = inject(ResultsManagementService);
  private sharedUtilsService = inject(SharedUtilsService);
  private resultDetailsModalService = inject(ResultUserDetailsModalService);

  // --- Estado principal ---
  adminResultsData = signal<AdminResult[]>([]);
  loading = signal(true);

  availableFilters = signal<ResultsAvailableFilters>({
    main_topics: [],
    levels: [],
    statuses: [],
    roles: ['user', 'guest', 'admin', 'deleted'],
  });

  private readonly defaultFilters: AdminResultsFilter = {
    page: 1,
    page_size: 20,
    status: 'all',
    user__role: 'all',
    test__main_topic: 'all',
    test__level: 'all',
    updated_at: '',
    started_at: '',
    min_score: undefined,
    max_score: undefined,
    ordering: 'updated_at',
    order_dir: 'desc',
    search: '',
  };
  selectedFilters = signal<AdminResultsFilter>(this.defaultFilters);

  stats = signal<ResultsStats>({
    total_filtered: 0,
    total_unfiltered: 0,
    average_score: 0,
    total_time_spent: 0,
  });
  totalPages = signal(0);
  hasMore = signal(false);

  // --- UI ---
  showFilters = signal(false);
  showAdvancedFilters = signal(false);

  // --- Ordenamiento ---
  sortOptions = [
    { value: 'updated_at', label: 'Última actualización' },
    { value: 'started_at', label: 'Fecha de inicio' },
    { value: 'score', label: 'Puntuación' },
    { value: 'time_taken', label: 'Tiempo empleado' },
    { value: 'correct_answers', label: 'Correctas' },
    { value: 'user__username', label: 'Usuario' },
    { value: 'test__title', label: 'Título' },
    { value: 'test__main_topic', label: 'Tema' },
    { value: 'test__level', label: 'Nivel' },
  ];

  // --- Selección y eliminación (unificado) ---
  selectedResults = signal<Set<number>>(new Set());
  isAllSelected = signal(false);
  isIndeterminate = signal(false);
  deleteModal = signal<DeleteModalState>({ type: 'none' });
  deleteInProgress = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Computed: etiqueta del orden actual
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'updated_at';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Última actualización';
  });

  // Computed: índices de paginación
  startIndex = computed(() => (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1);
  endIndex = computed(() => Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.stats().total_filtered));

  // Computed: número de elementos seleccionados
  selectedCount = computed(() => this.selectedResults().size);

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadResults();
  }

  // --- Almacenamiento de filtros ---
  private readonly FILTER_STORAGE_KEY = 'admin_results_filters';

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


  // --- Construcción de filtros ---
  private buildFilter(): AdminResultsFilter {
    const raw = this.selectedFilters();
    const orderingParam = raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering;

    const filters = {
      ...raw,
      ordering: orderingParam
    };

    if (raw.ordering) {
      filters.ordering = raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering;
    }
    return filters;
  }

  // --- Carga de resultados ---
  loadResults(): void {
    this.loading.set(true);
    const filters = this.buildFilter();

    this.resultsManagementService.getAdminResults(filters).subscribe({
      next: (res: AdminResultsResponse) => {
        this.adminResultsData.set(res.data);
        this.totalPages.set(res.pagination.total_pages);
        this.hasMore.set(res.pagination.has_more);
        this.stats.set(res.stats);
        this.availableFilters.set(res.available_filters);
        this.loading.set(false);
        this.saveFilters();
        this.clearSelection();
      },
      error: (err) => {
        console.error('Error al cargar resultados administrativos:', err);
        this.loading.set(false);
      },
    });
  }

  // --- Métodos de filtros ---
  updateFilter<K extends keyof AdminResultsFilter>(key: K, value: AdminResultsFilter[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      // Al cambiar cualquier filtro que no sea página, resetear a página 1
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadResults();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadResults();
  }

  removeFilter(key: keyof AdminResultsFilter): void {
    const defaultValue = this.defaultFilters[key] ?? '';
    this.updateFilter(key, defaultValue);
  }

  // --- Ordenamiento ---
  setSortBy(sortBy: string): void {
    this.updateFilter('ordering', sortBy);
  }

  toggleSortOrder(): void {
    const currentDir = this.selectedFilters().order_dir || 'desc';
    this.updateFilter('order_dir', currentDir === 'asc' ? 'desc' : 'asc');
  }

  getSortOrderIcon(): string {
    return this.selectedFilters().order_dir === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedFilters().order_dir === 'asc' ? 'Ascendente' : 'Descendente';
  }

  // --- Paginación ---
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.updateFilter('page', page);
  }

  previousPage(): void {
    if (this.selectedFilters().page > 1) {
      this.goToPage(this.selectedFilters().page - 1);
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.goToPage(this.selectedFilters().page + 1);
    }
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(
      this.totalPages(),
      this.selectedFilters().page
    );
  }

  // --- Utilidades UI ---
  showFilterIndicators(): boolean {
    const f = this.selectedFilters();
    return !!(f.user__role !== 'all' || f.started_at !== '' || f.updated_at !== '' ||
              f.test__main_topic !== 'all' || f.test__level !== 'all' || f.status !== 'all' || 
              f.min_score || f.max_score || f.search);
  }

  showPagination(): boolean {
    return this.stats().total_filtered > 0 && this.totalPages() > 1;
  }

  // --- Detalles de resultado ---
  showResultDetails(result: AdminResult): void {
    if (!result.user_id) return;
    this.resultDetailsModalService.open(result.user_id, result.id);
  }

  // --- Exportar ---
  exportResults(): void {
    if (this.loading()) return;
    this.loading.set(true);
    const filters = this.buildFilter();

    this.resultsManagementService.exportResults(filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        a.download = `resultados_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.loading.set(false);
        this.successMessage.set('Resultados exportados correctamente.');
      },
      error: (err) => {
        console.error('Error al exportar:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al exportar los resultados.');
      }
    });
  }

  // --- Eliminación (individual y masiva) ---
  confirmDeleteResult(result: AdminResult): void {
    this.deleteModal.set({ type: 'single', result });
  }

  confirmBulkDelete(): void {
    const count = this.selectedResults().size;
    if (count === 0) return;
    this.deleteModal.set({ type: 'bulk', count });
  }

  deleteResult(): void {
    const modal = this.deleteModal();
    if (modal.type !== 'single') return;
    const result = modal.result;
    this.deleteInProgress.set(true);
    this.resultsManagementService.deleteResult(result.id).subscribe({
      next: () => {
        this.adminResultsData.update(list => list.filter(r => r.id !== result.id));
        this.loadResults();
        this.deleteModal.set({ type: 'none' });
        this.deleteInProgress.set(false);
        this.successMessage.set('Resultado eliminado correctamente.');
      },
      error: (err) => {
        console.error(err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar.');
      }
    });
  }

  deleteSelectedResults(): void {
    const ids = Array.from(this.selectedResults());
    if (ids.length === 0) return;
    this.deleteInProgress.set(true);
    this.resultsManagementService.deleteResultsBulk(ids).subscribe({
      next: () => {
        this.adminResultsData.update(list => list.filter(r => !ids.includes(r.id)));
        this.loadResults();
        this.clearSelection();
        this.deleteModal.set({ type: 'none' });
        this.deleteInProgress.set(false);
        this.successMessage.set(`${ids.length} resultado(s) eliminado(s).`);
        if (this.adminResultsData().length === 0 && this.selectedFilters().page > 1) {
          this.goToPage(this.selectedFilters().page - 1);
        }
      },
      error: (err) => {
        console.error(err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar los resultados.');
      }
    });
  }

  closeDeleteModal(): void {
    this.deleteModal.set({ type: 'none' });
  }

  getDeleteMessage(): string {
    const modal = this.deleteModal();
    if (modal.type === 'single') {
      const name = this.getUserFullName(modal.result);
      return `¿Estás seguro de eliminar el resultado del usuario "${name}" en el test "${modal.result.test__title}"?`;
    }
    return '';
  }

  // --- Selección ---
  toggleResultSelection(resultId: number): void {
    const set = this.selectedResults();
    if (set.has(resultId)) {
      set.delete(resultId);
    } else {
      set.add(resultId);
    }
    this.selectedResults.set(new Set(set));
    this.updateSelectionState();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      const allIds = this.adminResultsData().map(r => r.id);
      this.selectedResults.set(new Set(allIds));
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    }
  }

  clearSelection(): void {
    this.selectedResults.set(new Set());
    this.isAllSelected.set(false);
    this.isIndeterminate.set(false);
  }

  private updateSelectionState(): void {
    const total = this.adminResultsData().length;
    const selected = this.selectedResults().size;
    if (selected === 0) {
      this.isAllSelected.set(false);
      this.isIndeterminate.set(false);
    } else if (selected === total) {
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    } else {
      this.isAllSelected.set(false);
      this.isIndeterminate.set(true);
    }
  }

  // --- Helpers de utilidad (delegados al servicio compartido) ---
  getUserFullName(result: AdminResult): string {
    if (result.user__first_name && result.user__last_name) {
      return `${result.user__first_name} ${result.user__last_name}`;
    }
    return result.user__username;
  }

  getRoleBadgeClass(role: string): string {
    return this.sharedUtilsService.getSharedRoleBadgeClass(role);
  }
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
  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }
  formatDateTime(date: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(date);
  }
  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }
  formatTimeShort(date: string): string {
    return this.sharedUtilsService.sharedFormatTimeShort(date);
  }

  closeToast(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal.component';
import { ResultsUserService } from '../../services/results-user.service';
import { UsersManagementService } from '../../services/users-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { ResultUserDetailsModalService } from '../../services/result-user-details-modal.service';
import { ResultUserDetailsModalComponent } from '../result-user-details-modal/result-user-details-modal.component';
import { User } from '../../../shared/models/user.models';
import { ResultsUserFilters, ResultsUserResponse, ResultsUserStats, ResultUsertItem } from '../../models/results-user.models';

type DeleteModalState = 
  | { type: 'none' }
  | { type: 'single'; result: ResultUsertItem };

@Component({
  selector: 'app-user-results',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ModalComponent,
    ResultUserDetailsModalComponent 
  ],
  templateUrl: './results-user.component.html',
})
export class ResultsUserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userResultsService = inject(ResultsUserService);
  private sharedUtilsService = inject(SharedUtilsService);
  private usersManagementService = inject(UsersManagementService);
  private resultDetailsModalService = inject(ResultUserDetailsModalService);

  // Señales
  loading = signal(true);
  loadingUser = signal(true);
  userId = signal<number | null>(null);
  user = signal<User | null>(null);
  userResults = signal<ResultUsertItem[]>([]);

  // Filtros (unificado)
  private readonly defaultFilters: ResultsUserFilters = {
    page: 1,
    page_size: 20,
    search: '',    
    status: 'all',
    test__main_topic: 'all',
    test__level: 'all',
    updated_at: '',
    started_at: '',
    max_score: undefined,
    min_score: undefined,
    ordering: 'updated_at',
    order_dir: 'desc',
  };
  selectedFilters = signal<ResultsUserFilters>(this.defaultFilters);

  stats = signal<ResultsUserStats>({
    total_filtered: 0,
    total_unfiltered: 0,
    completed_tests: 0,
    in_progress_tests: 0,
    average_score: 0,
    total_time_spent: 0,
    total_questions_answered: 0,
    total_correct_answers: 0,
  });
  totalPages = signal(0);
  hasMore = signal(false);

  // UI
  showFilters = signal(false);
  showAdvancedFilters = signal(false);

  // Ordenamiento
  sortOptions = [
    { value: 'updated_at', label: 'Última actualización' },
    { value: 'started_at', label: 'Fecha de inicio' },
    { value: 'score', label: 'Puntuación' },
    { value: 'time_taken', label: 'Tiempo empleado' },
    { value: 'correct_answers', label: 'Correctas' },
    { value: 'test__title', label: 'Título' },
    { value: 'test__main_topic', label: 'Tema' },
    { value: 'test__level', label: 'Nivel' },
  ];

  // Filtros disponibles (se cargan desde el backend)
  availableFilters = signal<{ main_topics: string[], levels: string[], statuses: any[] }>({
    main_topics: [],
    levels: [],
    statuses: []
  });

  // Mensajes
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Eliminación
  deleteModal = signal<DeleteModalState>({ type: 'none' });
  deleteInProgress = signal(false);

  // Computed
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'updated_at';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Última actualización';
  });

  startIndex = computed(() => (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1);
  endIndex = computed(() => Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.stats().total_filtered));

  totalUserResults = computed(() => this.stats().total_filtered);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      if (userId) {
        this.userId.set(userId);
        this.loadSavedFilters();
        this.loadUserProfile(userId);
        this.loadResults();
      }
    });
  }

  // --- Almacenamiento de filtros ---
  private readonly FILTER_STORAGE_KEY = 'results_user_filters';

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


  loadUserProfile(userId: number): void {
    this.loadingUser.set(true);
    this.usersManagementService.getUserProfile(userId).subscribe({
      next: (response) => {
        this.user.set(response);
        this.loadingUser.set(false);
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.loadingUser.set(false);
      }
    });
  }

  loadResults(): void {
    if (!this.userId()) return;
    this.loading.set(true);

    // Construir el filtro para el servicio
    const raw = this.selectedFilters();
    const filters: ResultsUserFilters = {
      ...raw,
      ordering: raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering,
    };

    this.userResultsService.getUserResults(this.userId()!, filters).subscribe({
      next: (res: ResultsUserResponse) => {
        this.userResults.set(res.data);
        this.totalPages.set(res.pagination.total_pages);
        this.hasMore.set(res.pagination.has_more);
        this.stats.set(res.stats);
        if (res.available_filters) {
          this.availableFilters.set(res.available_filters);
        }
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error loading user results:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al cargar los resultados.');
      }
    });
  }

  // Filtros
  updateFilter<K extends keyof ResultsUserFilters>(key: K, value: ResultsUserFilters[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadResults();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadResults();
  }

  removeFilter(key: keyof ResultsUserFilters): void {
    const defaultValue = this.defaultFilters[key] ?? '';
    this.updateFilter(key, defaultValue);
  }

  // Ordenación
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

  // Paginación
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

  showFilterIndicators(): boolean {
    const f = this.selectedFilters();
    return !!(f.status !== 'all' || f.test__main_topic !== 'all' || f.test__level !== 'all' ||
              f.started_at !== '' || f.min_score || f.max_score || f.updated_at !== '' || f.search);
  }

  showPagination(): boolean {
    return this.stats().total_filtered > 0 && this.totalPages() > 1;
  }

  // Eliminación
  confirmDeleteResult(result: ResultUsertItem): void {
    this.deleteModal.set({ type: 'single', result });
  }

  deleteResult(): void {
    const modal = this.deleteModal();
    if (modal.type !== 'single') return;
    const result = modal.result;
    this.deleteInProgress.set(true);
    this.userResultsService.deleteResult(result.id).subscribe({
      next: () => {
        this.userResults.update(list => list.filter(r => r.id !== result.id));
        this.loadResults();
        this.deleteModal.set({ type: 'none' });
        this.deleteInProgress.set(false);
        this.successMessage.set('Resultado eliminado correctamente.');
      },
      error: (err) => {
        console.error(err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar el resultado.');
      }
    });
  }

  closeDeleteModal(): void {
    this.deleteModal.set({ type: 'none' });
  }

  getDeleteMessage(): string {
    const modal = this.deleteModal();
    if (modal.type === 'single') {
      return `¿Estás seguro de eliminar el resultado del test "${modal.result.test__title}"? Esta acción no se puede deshacer.`;
    }
    return '';
  }

  // Detalles
  showResultDetails(result: ResultUsertItem): void {
    if (!this.userId()) return;
    this.resultDetailsModalService.open(this.userId()!, result.id);
  }

  // Volver
  goBack(): void {
    this.router.navigate(['/admin/users/']);
  }

  // Toast
  closeToast(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Helpers (delegados al servicio compartido)
  getUserFullName(): string {
    const u = this.user();
    if (!u) return 'Usuario';
    if (u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    return u.username;
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
  getScoreBgColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreBgColor(score);
  }
  formatDateTime(date: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(date);
  }
  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }
  getProgressBarEmpty(): string {
    return this.sharedUtilsService.getSharedProgressBarEmpty();
  }
  getProgressBarColor(progress: number): string {
    return this.sharedUtilsService.getSharedProgressBarColor(progress);
  }
  calculatePercentage(answered: number, total: number): number {
    return this.sharedUtilsService.sharedCalculatePercentage(answered, total);
  }
}
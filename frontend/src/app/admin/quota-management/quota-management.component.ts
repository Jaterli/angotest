import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotaManagementService } from '../services/quota-management.service';
import { UserQuota, QuotaFilter, QuotaResponse, CreateQuotaInput, UpdateQuotaInput } from '../models/quota-management.models';
import { ModalComponent } from '../../shared/components/modal.component';
import { IdWithIconButtonComponent } from '../shared-components/id-with-icon-button.component';
import { UserProfileModalComponent } from '../user/user-profile-modal.component/user-profile-modal.component';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { UserModalService } from '../services/user-modal.service';

@Component({
  selector: 'app-quota-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    IdWithIconButtonComponent,
    UserProfileModalComponent
  ],
  templateUrl: './quota-management.component.html'
})
export class QuotaManagementComponent implements OnInit {
  private quotaService = inject(QuotaManagementService);
  private sharedUtilsService = inject(SharedUtilsService);
  private userModalService = inject(UserModalService);

  // ========== DATOS ==========
  quotasData = signal<UserQuota[]>([]);

  // ========== ESTADOS ==========
  loading = signal(true);
  loadingStats = signal(true);
  deleting = signal(false);     // alias de deleteInProgress
  saving = signal(false);       // alias de saveInProgress

  // ========== FILTROS ==========
  private readonly defaultFilters: QuotaFilter = {
    page: 1,
    page_size: 20,
    ordering: 'month_year',
    order_dir: 'desc',
    search: '',
    user_id: undefined,
    month_year: 'all',
    min_requests: undefined,
    max_requests: undefined,
    min_usage: 'all',
    start_date: undefined,
    end_date: undefined
  };
  selectedFilters = signal<QuotaFilter>(this.defaultFilters);

  // Opciones de ordenación
  sortOptions = [
    { value: 'month_year', label: 'Mes/Año' },
    { value: 'used_requests', label: 'Solicitudes usadas' },
    { value: 'max_requests', label: 'Límite de solicitudes' },
    { value: 'user__username', label: 'Username' },
    { value: 'created_at', label: 'Fecha de creación' }
  ];

  // --- Estados disponibles ---
  usageOptions = [
    { value: 'all', label: 'Cualquier %' },
    { value: '10', label: 'Más de 10%' },
    { value: '20', label: 'Más de 20%' },
    { value: '30', label: 'Más de 30%' },
    { value: '40', label: 'Más de 40%' },
    { value: '50', label: 'Más de 50%' },
    { value: '60', label: 'Más de 60%' },
    { value: '70', label: 'Más de 70%' },
    { value: '80', label: 'Más de 80%' },
    { value: '90', label: 'Más de 90%' },
    { value: '100', label: '100%' }  
  ];

  // ========== PAGINACIÓN ==========
  totalItems = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);

  // ========== ESTADÍSTICAS ==========
  // (No se usan en este componente, pero se mantiene la estructura)
  stats = signal({
    total_filtered: 0,
    total_unfiltered: 0
  });

  // ========== UI ==========
  showFilters = signal(false);
  showAdvancedFilters = signal(false);
  viewMode = signal<'table' | 'cards'>('table');

  // Meses disponibles (últimos 12 meses)
  availableMonths = signal<string[]>([]);

  // ========== COMPUTED ==========
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'month_year';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Mes/Año';
  });

  startIndex = computed(() =>
    (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1
  );
  endIndex = computed(() =>
    Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.totalItems())
  );

  // ========== SELECCIÓN MASIVA ==========
  selectedQuotas = signal<Set<number>>(new Set());
  isAllSelected = signal(false);
  isIndeterminate = signal(false);
  selectedCount = signal(0);

  // ========== MODALES ==========
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  showViewModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);

  // ========== ELEMENTOS ACTUALES ==========
  quotaToEdit = signal<UserQuota | null>(null);
  quotaToDelete = signal<UserQuota | null>(null);
  quotaToView = signal<UserQuota | null>(null);
  selectedQuotaId = signal<number | null>(null);

  // ========== FORMULARIOS ==========
  createQuotaForm = signal<CreateQuotaInput>({
    user_id: 0,
    month_year: new Date().toISOString().slice(0, 7),
    max_requests: 5
  });
  editQuotaForm = signal<UpdateQuotaInput>({});

  // ========== MENSAJES ==========
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  modalTitle = signal('');
  modalMessage = signal('');

  // ========== VALIDACIÓN ==========
  validationErrors = signal<{ [key: string]: string }>({});

  // ========== PERSISTENCIA DE FILTROS ==========
  private readonly FILTER_STORAGE_KEY = 'quotas_filters';

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadAvailableMonths();
    this.loadQuotas();
  }

  // ---------- PERSISTENCIA ----------
  loadSavedFilters(): void {
    try {
      const saved = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.selectedFilters.set({ ...this.defaultFilters, ...parsed });
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

  // ---------- CARGA DE DATOS ----------
  loadAvailableMonths(): void {
    const months: string[] = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      months.push(date.toISOString().slice(0, 7));
      date.setMonth(date.getMonth() - 1);
    }
    this.availableMonths.set(months);
  }

  loadQuotas(): void {
    this.loading.set(true);

    // Construir el parámetro ordering combinando order_dir y ordering
    const raw = this.selectedFilters();
    const orderingParam = raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering;

    const filters = {
      ...raw,
      ordering: orderingParam
    };

    this.quotaService.getQuotas(filters).subscribe({
      next: (res: QuotaResponse) => {
        this.quotasData.set(res.data);
        this.totalItems.set(res.pagination.total_filtered);
        this.totalPages.set(res.pagination.total_pages);
        this.hasMore.set(res.pagination.has_more);
        this.loading.set(false);
        this.saveFilters();
        this.clearSelection();
      },
      error: (err) => {
        console.error('Error al cargar cuotas:', err);
        this.errorMessage.set('Error al cargar las cuotas');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  // ---------- MÉTODOS DE FILTROS ----------
  updateFilter<K extends keyof QuotaFilter>(key: K, value: QuotaFilter[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadQuotas();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadQuotas();
  }

  removeFilter(key: keyof QuotaFilter): void {
    const defaultValue = this.defaultFilters[key];
    this.updateFilter(key, defaultValue);
  }

  showFilterIndicators(): boolean {
    const f = this.selectedFilters();
    return !!(f.search || f.user_id || f.month_year != 'all' || f.max_requests !== undefined || f.min_requests !== undefined || f.min_usage !== 'all' || f.start_date || f.end_date);
  }

  // ---------- ORDENACIÓN ----------
  setSortBy(sortBy: string): void {
    this.updateFilter('ordering', sortBy);
  }

  toggleSortOrder(): void {
    const currentDir = this.selectedFilters().order_dir || 'asc';
    this.updateFilter('order_dir', currentDir === 'asc' ? 'desc' : 'asc');
  }

  getSortOrderIcon(): string {
    return this.selectedFilters().order_dir === 'asc' ? '↑' : '↓';
  }

  // ---------- PAGINACIÓN ----------
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

  showPagination(): boolean {
    return this.totalItems() > 0 && this.totalPages() > 1;
  }

  // ---------- SELECCIÓN MASIVA ----------
  toggleQuotaSelection(quotaId: number): void {
    const selected = this.selectedQuotas();
    if (selected.has(quotaId)) {
      selected.delete(quotaId);
    } else {
      selected.add(quotaId);
    }
    this.selectedQuotas.set(new Set(selected));
    this.updateSelectionState();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      const allIds = this.quotasData().map(q => q.id);
      this.selectedQuotas.set(new Set(allIds));
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    }
    this.updateSelectedCount();
  }

  clearSelection(): void {
    this.selectedQuotas.set(new Set());
    this.isAllSelected.set(false);
    this.isIndeterminate.set(false);
    this.updateSelectedCount();
  }

  updateSelectionState(): void {
    const totalItems = this.quotasData().length;
    const selectedCount = this.selectedQuotas().size;

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
    this.selectedCount.set(this.selectedQuotas().size);
  }

  // ---------- CRUD ----------
  openCreateModal(): void {
    this.validationErrors.set({});
    this.createQuotaForm.set({
      user_id: 0,
      month_year: new Date().toISOString().slice(0, 7),
      max_requests: 5
    });
    this.modalTitle.set('Crear nueva cuota');
    this.showCreateModal.set(true);
  }

  openEditModal(quota: UserQuota): void {
    this.validationErrors.set({});
    this.quotaToEdit.set(quota);
    this.editQuotaForm.set({
      max_requests: quota.max_requests,
      used_requests: quota.used_requests
    });
    this.modalTitle.set(`Editar cuota - ${quota.user__username || quota.user_id} (${quota.month_year})`);
    this.showEditModal.set(true);
  }

  openViewModal(quota: UserQuota): void {
    this.quotaToView.set(quota);
    this.showViewModal.set(true);
  }

  validateCreateForm(): boolean {
    const errors: { [key: string]: string } = {};
    const form = this.createQuotaForm();

    if (!form.user_id || form.user_id <= 0) {
      errors['user_id'] = 'El ID de usuario es requerido';
    }
    if (!form.month_year) {
      errors['month_year'] = 'El mes/año es requerido';
    }
    if (!form.max_requests || form.max_requests < 1) {
      errors['max_requests'] = 'El límite debe ser al menos 1';
    }

    this.validationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  validateEditForm(): boolean {
    const errors: { [key: string]: string } = {};
    const form = this.editQuotaForm();
    const quota = this.quotaToEdit();

    if (form.max_requests !== undefined && form.max_requests < 1) {
      errors['max_requests'] = 'El límite debe ser al menos 1';
    }
    if (form.used_requests !== undefined && quota && form.used_requests < 0) {
      errors['used_requests'] = 'El uso no puede ser negativo';
    }

    this.validationErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  createQuota(): void {
    if (!this.validateCreateForm()) return;

    this.saving.set(true);
    this.quotaService.createQuota(this.createQuotaForm()).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.showCreateModal.set(false);
        this.loadQuotas();
        this.successMessage.set(response.message || 'Cuota creada exitosamente');
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al crear cuota:', err);
        this.saving.set(false);
        this.errorMessage.set(err.error?.existing
          ? 'Ya existe una cuota para este usuario y mes'
          : err.error?.error || 'Error al crear la cuota'
        );
        this.showErrorModal.set(true);
      }
    });
  }

  updateQuota(): void {
    if (!this.validateEditForm()) return;

    const quota = this.quotaToEdit();
    if (!quota) return;

    this.saving.set(true);
    this.quotaService.updateQuota(quota.id, this.editQuotaForm()).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.showEditModal.set(false);
        this.quotaToEdit.set(null);
        this.loadQuotas();
        this.successMessage.set(response.message || 'Cuota actualizada exitosamente');
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al actualizar cuota:', err);
        this.saving.set(false);
        this.errorMessage.set(err.error?.error || 'Error al actualizar la cuota');
        this.showErrorModal.set(true);
      }
    });
  }

  confirmDeleteQuota(quota: UserQuota): void {
    this.quotaToDelete.set(quota);
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar la cuota de ${quota.user__username || quota.user_id} para ${quota.month_year}? Esta acción no se puede deshacer.`);
    this.showDeleteModal.set(true);
  }

  confirmBulkDelete(): void {
    if (this.selectedCount() === 0) return;

    this.modalTitle.set('Confirmar eliminación masiva');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar ${this.selectedCount()} cuota(s) seleccionada(s)? Esta acción no se puede deshacer.`);
    this.showBulkDeleteModal.set(true);
  }

  deleteQuota(): void {
    const quota = this.quotaToDelete();
    if (!quota) return;

    this.deleting.set(true);
    this.quotaService.deleteQuota(quota.id).subscribe({
      next: (response) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.quotaToDelete.set(null);
        this.loadQuotas();
        this.successMessage.set(response.message || 'Cuota eliminada correctamente.');
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al eliminar cuota:', err);
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.errorMessage.set('Error al eliminar la cuota: ' + (err.error?.error || 'Error desconocido'));
        this.showErrorModal.set(true);
      }
    });
  }

  deleteSelectedQuotas(): void {
    const selectedIds = Array.from(this.selectedQuotas());
    if (selectedIds.length === 0) return;

    this.deleting.set(true);
    this.quotaService.deleteQuotasBulk(selectedIds).subscribe({
      next: (response) => {
        this.deleting.set(false);
        this.showBulkDeleteModal.set(false);
        this.clearSelection();
        this.loadQuotas();
        this.successMessage.set(`${selectedIds.length} cuota(s) eliminada(s) correctamente.`);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al eliminar cuotas:', err);
        this.deleting.set(false);
        this.showBulkDeleteModal.set(false);
        this.errorMessage.set('Error al eliminar las cuotas: ' + (err.error?.error || 'Error desconocido'));
        this.showErrorModal.set(true);
      }
    });
  }

  // ---------- UTILIDADES UI ----------
  openUserProfile(userId: number): void {
    this.userModalService.open(userId);
  }

  getUsagePercentage(quota: UserQuota): number {
    if (!quota || quota.max_requests === 0) return 0;
    return Math.round((quota.used_requests / quota.max_requests) * 100 * 100) / 100;
  }

  getRemainingRequests(quota: UserQuota): number {
    return quota ? quota.max_requests - quota.used_requests : 0;
  }

  getProgressBarColor(usagePercentage: number): string {
    const remaining = 100 - usagePercentage;
    return this.sharedUtilsService.getSharedProgressBarColor(remaining);
  }

  getProgressColor(usagePercentage: number): string {
    const remaining = 100 - usagePercentage;
    return this.sharedUtilsService.getSharedProgressColor(remaining);
  }

  formatMonthYear(monthYear: string): string {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value);
  }

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  // ---------- CIERRE DE MODALES ----------
  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.successMessage.set(null);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
    this.errorMessage.set(null);
  }

  closeToast(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
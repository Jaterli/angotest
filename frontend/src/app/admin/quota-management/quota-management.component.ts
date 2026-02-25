import { Component, OnInit, signal, inject } from '@angular/core';
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

  // Datos
  quotasData = signal<UserQuota[]>([]);
  loading = signal(true);
  loadingStats = signal(true);

  // Filtros
  selectedFilters = signal<QuotaFilter>({
    page: 1,
    page_size: 20,
    sort_by: 'month_year',
    sort_order: 'desc'
  });

  // Paginación
  currentPage = signal(1);
  totalItems = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);

  // Estado de la UI
  showFilters = signal(false);
  showAdvancedFilters = signal(false);
  viewMode = signal<'table' | 'cards'>('table');


  // Opciones de ordenamiento
  sortOptions = [
    { value: 'month_year', label: 'Mes/Año' },
    { value: 'used_requests', label: 'Solicitudes usadas' },
    { value: 'max_requests', label: 'Límite de solicitudes' },
    { value: 'user_name', label: 'Usuario' },
    { value: 'created_at', label: 'Fecha de creación' }
  ];

  // Meses disponibles (últimos 12 meses)
  availableMonths = signal<string[]>([]);

  // Memoria de filtros
  private readonly FILTER_STORAGE_KEY = 'quotas_filters';

  // --- SEÑALES PARA ELIMINACIÓN MASIVA ---
  selectedQuotas = signal<Set<number>>(new Set());
  isAllSelected = signal(false);
  isIndeterminate = signal(false);

  // Modales
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  showViewModal = signal(false);
  deleteInProgress = signal(false);
  saveInProgress = signal(false);

  // Datos para editar/crear
  quotaToEdit = signal<UserQuota | null>(null);
  quotaToDelete = signal<UserQuota | null>(null);
  quotaToView = signal<UserQuota | null>(null);
  selectedQuotaId = signal<number | null>(null);

  // Formulario
  createQuotaForm = signal<CreateQuotaInput>({
    user_id: 0,
    month_year: new Date().toISOString().slice(0, 7),
    max_requests: 5
  });

  editQuotaForm = signal<UpdateQuotaInput>({});
  selectedCount = signal(0);

  // Mensajes Toast
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Mensajes del modal
  modalTitle = signal('');
  modalMessage = signal('');

  // Tooltips y validación
  validationErrors = signal<{ [key: string]: string }>({});
  
  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadAvailableMonths();
    this.loadQuotas();
    //this.loadStats();
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

    this.quotaService.getQuotas(this.selectedFilters()).subscribe({
      next: (res: QuotaResponse) => {
        this.quotasData.set(res.quotas);

        this.totalItems.set(res.pagination.total_items);
        this.totalPages.set(res.pagination.total_pages);
        
        this.hasMore.set(this.currentPage() < this.totalPages());

        this.loading.set(false);
        this.saveFilters();
        this.clearSelection();
      },
      error: (err) => {
        console.error('Error al cargar cuotas:', err);
        this.loading.set(false);
      }
    });
  }

  // --- MÉTODOS PARA FILTROS ---
  onFilterChange(): void {
    this.selectedFilters.update(filters => ({ ...filters, page: 1 }));
    this.currentPage.set(1);
    this.loadQuotas();
  }

  resetFilters(): void {
    this.selectedFilters.set({
      page: 1,
      page_size: 20,
      sort_by: 'month_year',
      sort_order: 'desc'
    });
    this.currentPage.set(1);
    this.loadQuotas();
  }

  updateFilter<T extends keyof QuotaFilter>(key: T, value: QuotaFilter[T]): void {
    this.selectedFilters.update(filters => ({ ...filters, [key]: value }));
    if (key !== 'page') {
      this.onFilterChange();
    }
  }

  removeFilter(key: keyof QuotaFilter): void {
    this.updateFilter(key, undefined);
    this.onFilterChange();
  }

  // --- MÉTODOS PARA ORDENAMIENTO ---
  toggleSortOrder(): void {
    const currentOrder = this.selectedFilters().sort_order;
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    this.updateFilter('sort_order', newOrder);
  }

  setSortBy(sortBy: string): void {
    this.updateFilter('sort_by', sortBy);
  }

  // --- MÉTODOS PARA PAGINACIÓN ---
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadQuotas();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(this.totalPages(), this.currentPage());
  }

  // --- MÉTODOS PARA SELECCIÓN MASIVA ---
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

  // --- MÉTODOS PARA CREAR/EDITAR ---
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
    this.modalTitle.set(`Editar cuota - ${quota.username || quota.user_id} (${quota.month_year})`);
    this.showEditModal.set(true);
  }

  openViewModal(quota: UserQuota): void {
    this.quotaToView.set(quota);
    this.showViewModal.set(true);
  }

  validateCreateForm(): boolean {
    const errors: { [key: string]: string } = {};
    
    if (!this.createQuotaForm().user_id || this.createQuotaForm().user_id <= 0) {
      errors['user_id'] = 'El ID de usuario es requerido';
    }
    
    if (!this.createQuotaForm().month_year) {
      errors['month_year'] = 'El mes/año es requerido';
    }
    
    if (!this.createQuotaForm().max_requests || this.createQuotaForm().max_requests < 1) {
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
    if (!this.validateCreateForm()) {
      return;
    }

    this.saveInProgress.set(true);

    this.quotaService.createQuota(this.createQuotaForm()).subscribe({
      next: (response) => {
        this.saveInProgress.set(false);
        this.showCreateModal.set(false);
        this.loadQuotas();
        this.successMessage.set(response.message || 'Cuota creada exitosamente');
      },
      error: (err) => {
        console.error('Error al crear cuota:', err);
        this.saveInProgress.set(false);
        
        if (err.error?.existing) {
          // Ya existe una cuota para este usuario y mes
          this.errorMessage.set('Ya existe una cuota para este usuario y mes');
        } else {
          this.errorMessage.set(err.error?.error || 'Error al crear la cuota');
        }
      }
    });
  }

  updateQuota(): void {
    if (!this.validateEditForm()) {
      return;
    }

    const quota = this.quotaToEdit();
    if (!quota) return;

    this.saveInProgress.set(true);

    this.quotaService.updateQuota(quota.id, this.editQuotaForm()).subscribe({
      next: (response) => {
        this.saveInProgress.set(false);
        this.showEditModal.set(false);
        this.quotaToEdit.set(null);
        this.loadQuotas();
        this.successMessage.set(response.message || 'Cuota actualizada exitosamente');
      },
      error: (err) => {
        console.error('Error al actualizar cuota:', err);
        this.saveInProgress.set(false);
        this.errorMessage.set(err.error?.error || 'Error al actualizar la cuota');
      }
    });
  }

  // --- MÉTODOS PARA ELIMINAR ---
  confirmDeleteQuota(quota: UserQuota): void {
    this.quotaToDelete.set(quota);
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar la cuota de ${quota.username || quota.user_id} para ${quota.month_year}? Esta acción no se puede deshacer.`);
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

    this.deleteInProgress.set(true);

    this.quotaService.deleteQuota(quota.id).subscribe({
      next: (response) => {
        this.quotasData.update(quotas => 
          quotas.filter(q => q.id !== quota.id)
        );

        this.totalItems.update(count => count - 1);
        this.showDeleteModal.set(false);
        this.quotaToDelete.set(null);
        this.deleteInProgress.set(false);

        this.successMessage.set(response.message || 'Cuota eliminada correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar cuota:', err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar la cuota: ' + (err.error?.error || 'Error desconocido').toString());
      }
    });
  }

  deleteSelectedQuotas(): void {
    const selectedIds = Array.from(this.selectedQuotas());
    if (selectedIds.length === 0) return;

    this.deleteInProgress.set(true);

    this.quotaService.deleteQuotasBulk(selectedIds).subscribe({
      next: (response) => {
        this.quotasData.update(quotas => 
          quotas.filter(q => !selectedIds.includes(q.id))
        );

        this.totalItems.update(count => count - selectedIds.length);
        this.clearSelection();
        this.showBulkDeleteModal.set(false);
        this.deleteInProgress.set(false);

        this.successMessage.set(`${selectedIds.length} cuota(s) eliminada(s) correctamente.`);

        if (this.quotasData().length === 0 && this.currentPage() > 1) {
          this.goToPage(this.currentPage() - 1);
        }
      },
      error: (err) => {
        console.error('Error al eliminar cuotas:', err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar las cuotas: ' + (err.error?.error || 'Error desconocido').toString());
      }
    });
  }

  // --- MÉTODOS DE UTILIDAD ---
  openUserProfile(userId: number): void {
    this.userModalService.open(userId);
  }

  getUsagePercentage(quota: UserQuota): number {
    if (!quota || quota.max_requests === 0) return 0;
    return Math.round((quota.used_requests / quota.max_requests) * 100 * 100) / 100; // Redondeado a 2 decimales
  }

  getRemainingRequests(quota: UserQuota): number {
    if (!quota) return 0;
    return quota.max_requests - quota.used_requests;
  }

  getProgressBarColor(usagePercentage: number): string {
    var remainingPercentage = 100 - usagePercentage;
    return this.sharedUtilsService.getSharedProgressBarColor(remainingPercentage);
  }

  getProgressColor(usagePercentage: number): string {
    var remainingPercentage = 100 - usagePercentage;
    return this.sharedUtilsService.getSharedProgressColor(remainingPercentage);
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

  getCurrentSortLabel(): string {
    const sortBy = this.selectedFilters().sort_by;
    const option = this.sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Mes/Año';
  }

  getSortOrderIcon(): string {
    const order = this.selectedFilters().sort_order;
    return order === 'asc' ? '↑' : '↓';
  }

  showFilterIndicators(): boolean {
    const filters = this.selectedFilters();
    return !!(
      filters.search ||
      filters.user_id ||
      filters.month_year ||
      filters.max_usage !== undefined ||
      filters.start_date ||
      filters.end_date
    );
  }

  showPagination(): boolean {
    return this.totalItems() > 0 && this.totalPages() > 1;
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.selectedFilters().page_size) + 1;
  }

  getEndIndex(): number {
    return Math.min(
      this.currentPage() * this.selectedFilters().page_size,
      this.totalItems()
    );
  }

  closeToast() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
  }

}
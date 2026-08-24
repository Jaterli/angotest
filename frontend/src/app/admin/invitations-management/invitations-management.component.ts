import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { InvitationResponse, InvitationsFilter, InvitationsResponse } from '../models/invitations-management.models';
import { InvitationsManagementService } from '../services/invitations-management.service';
import { UserModalService } from '../services/user-modal.service';
import { UserProfileModalComponent } from '../user/user-profile-modal.component/user-profile-modal.component';

@Component({
  selector: 'app-invitations-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, UserProfileModalComponent],
  templateUrl: './invitations-management.component.html'
})
export class InvitationsManagementComponent implements OnInit {
  private invitationsService = inject(InvitationsManagementService);
  private sharedUtilsService = inject(SharedUtilsService);
  private userModalService = inject(UserModalService);

  // --- Datos ---
  invitations = signal<InvitationResponse[]>([]);
  loading = signal(true);
  deleting = signal(false);

  // --- Filtros ---
  private readonly defaultFilters: InvitationsFilter = {
    page: 1,
    page_size: 20,
    ordering: 'created_at',
    order_dir: 'desc',
  };
  selectedFilters = signal<InvitationsFilter>({ ...this.defaultFilters });

  // --- Paginación (datos devueltos por el backend) ---
  totalPages = signal(0);
  hasMore = signal(false);
  totalItems = signal(0); // Para mostrar el total

  // --- Computed: índices de paginación ---
  startIndex = computed(() =>
    (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1
  );
  endIndex = computed(() =>
    Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.totalItems())
  );
  currentSortLabel = computed(() => {
    const sortBy = this.selectedFilters().order_dir || 'created_at';
    const option = this.sortOptions.find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de creación';
  });

  // --- Estado de la UI ---
  showFilters = signal(false);

  // --- Opciones de ordenación ---
  sortOptions = [
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'expires_at', label: 'Fecha de expiración' },
    { value: 'test__title', label: 'Título del test' },
    { value: 'invited_by', label: 'Creador' },
    { value: 'is_guest', label: 'Guest (true/false)' }
  ];

  // --- Estados disponibles ---
  statusOptions = [
    { label: 'Todos los estados' },
    { value: 'active', label: 'Activa' },
    { value: 'used', label: 'Usada' },
    { value: 'expired', label: 'Expirada' }
  ];

  getStatusLabel(status: string): string {
    const found = this.statusOptions.find(opt => opt.value === status);
    return found ? found.label : 'Desconocido';
  }

  // --- Modales de confirmación y feedback ---
  showDeleteModal = signal(false);           // eliminación individual
  showBulkDeleteModal = signal(false);       // eliminación masiva
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  errorMessage = signal('');

  modalTitle = signal('');
  modalMessage = signal('');
  successMessage = signal('');

  // --- Datos para eliminación individual ---
  invitationToDelete = signal<InvitationResponse | null>(null);

  // --- Selección masiva ---
  selectedInvitations = signal<Set<number>>(new Set());
  isAllSelected = signal(false);
  isIndeterminate = signal(false);
  selectedCount = computed(() => this.selectedInvitations().size);

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadInvitations();
  }

  // --- Memoria de filtros (localStorage) ---
  private readonly FILTER_STORAGE_KEY = 'invitations_filters';

  // --- Carga de filtros guardados ---
  loadSavedFilters(): void {
    try {
      const saved = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.selectedFilters.set({ ...this.selectedFilters(), ...parsed });
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

  // --- Carga de invitaciones ---
  loadInvitations(): void {
    this.loading.set(true);

    // Construir el filtro para el servicio
    const raw = this.selectedFilters();
    const filter: InvitationsFilter = {
      ...raw,
      ordering: raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering,
    };

    this.invitationsService.getInvitations(filter).subscribe({
      next: (res: InvitationsResponse) => {
        this.invitations.set(res.data);
        this.totalItems.set(res.stats.total_filtered);
        this.totalPages.set(res.pagination.total_pages);
        this.hasMore.set(res.pagination.has_more);
        this.loading.set(false);
        this.saveFilters();
        this.clearSelection();
      },
      error: (err) => {
        console.error('Error al cargar invitaciones:', err);
        this.errorMessage.set('Error al cargar la lista de invitaciones');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  // --- Métodos de filtros ---
  updateFilter<K extends keyof InvitationsFilter>(key: K, value: InvitationsFilter[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      // Al cambiar cualquier filtro que no sea página, resetear a página 1
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadInvitations();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadInvitations();
  }

  removeFilter(key: keyof InvitationsFilter): void {
    const defaultValue = this.defaultFilters[key] ?? undefined;
    this.updateFilter(key, defaultValue);
  }

  // --- Ordenamiento ---
  setSortBy(sortBy: string): void {
    this.updateFilter('ordering', sortBy);
  }

  toggleSortOrder(): void {
    const current = this.selectedFilters().order_dir || 'desc';
    const newOrder = current === 'asc' ? 'desc' : 'asc';
    this.updateFilter('order_dir', newOrder);
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

  // --- Computed para UI ---
  showFilterIndicators = computed(() => {
    const f = this.selectedFilters();
    return !!(f.status || f.is_used != undefined || f.start_date || f.end_date);
  });

  showPagination = computed(() => {
    return this.totalItems() > 0 && this.totalPages() > 1;
  });

  // --- Selección masiva ---
  toggleInvitationSelection(invitationId: number): void {
    const set = this.selectedInvitations();
    if (set.has(invitationId)) {
      set.delete(invitationId);
    } else {
      set.add(invitationId);
    }
    this.selectedInvitations.set(new Set(set));
    this.updateSelectionState();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      const allIds = this.invitations().map(inv => inv.id);
      this.selectedInvitations.set(new Set(allIds));
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    }
  }

  clearSelection(): void {
    this.selectedInvitations.set(new Set());
    this.isAllSelected.set(false);
    this.isIndeterminate.set(false);
  }

  private updateSelectionState(): void {
    const total = this.invitations().length;
    const selected = this.selectedInvitations().size;
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

  // --- Confirmación de eliminación individual ---
  confirmDeleteInvitation(invitation: InvitationResponse): void {
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar la invitación para el test "${invitation.test_title}"? Esta acción no se puede deshacer.`);
    this.showDeleteModal.set(true);
    this.invitationToDelete.set(invitation);
  }

  // --- Confirmación de eliminación masiva ---
  confirmBulkDelete(): void {
    if (this.selectedCount() === 0) return;
    this.modalTitle.set('Confirmar eliminación masiva');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar ${this.selectedCount()} invitación(es) seleccionada(s)? Esta acción no se puede deshacer.`);
    this.showBulkDeleteModal.set(true);
  }

  // --- Ejecutar eliminación individual ---
  deleteInvitation(): void {
    console.log('Eliminación confirmada');
    const invitation = this.invitationToDelete();
    if (!invitation) return;

    this.deleting.set(true);
    this.invitationsService.deleteInvitation(invitation.id).subscribe({
      next: () => {
        this.invitations.update(items => items.filter(i => i.id !== invitation.id));
        this.totalItems.update(count => count - 1);
        this.showDeleteModal.set(false);
        this.invitationToDelete.set(null);
        this.deleting.set(false);
        this.successMessage.set('Invitación eliminada correctamente.');
        this.showSuccessModal.set(true);        
      },
      error: (err) => {
        console.error('Error al eliminar invitación:', err);
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.errorMessage.set('Error al eliminar la invitación. '+ err.error?.error || 'Por favor, inténtalo de nuevo.');
        this.showErrorModal.set(true);
      }
    });
  }

  // --- Ejecutar eliminación masiva ---
  deleteSelectedInvitations(): void {
    const selectedIds = Array.from(this.selectedInvitations());
    if (selectedIds.length === 0) return;

    this.deleting.set(true);
    this.invitationsService.deleteInvitationsBulk(selectedIds).subscribe({
      next: () => {
        this.invitations.update(items => items.filter(i => !selectedIds.includes(i.id)));
        this.totalItems.update(count => count - selectedIds.length);
        this.clearSelection();
        this.showBulkDeleteModal.set(false);
        this.deleting.set(false);
        this.showSuccessModal.set(true);
        this.successMessage.set(`${selectedIds.length} invitación(es) eliminada(s) correctamente.`);

        // Si la página actual queda vacía, retroceder una página
        if (this.invitations().length === 0 && this.selectedFilters().page > 1) {
          this.goToPage(this.selectedFilters().page - 1);
        }
      },
      error: (err) => {
        console.error('Error al eliminar invitaciones:', err);
        this.deleting.set(false);
        this.showBulkDeleteModal.set(false);
        this.errorMessage.set('Error al eliminar las invitaciones. Por favor, inténtalo de nuevo.');
        this.showErrorModal.set(true);
      }
    });
  }

  // --- Cerrar modales ---
  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }

  // --- Otros métodos útiles ---
  openUserProfile(userId: number): void {
    this.userModalService.open(userId);
  }

  isInvitationExpired(date: string): boolean {
    return new Date(date) < new Date();
  }

  getStatusBadgeClass(status: string): string {
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
  }

  getBooleanBadgeClass(isGuest: boolean): string {
    return this.sharedUtilsService.getSharedBooleanBadgeClass(!isGuest);
  }

  getGuestLabel(isGuest: boolean): string {
    return isGuest ? 'Invitado' : 'Usuario Registrado';
  }

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.successMessage.set('URL copiada al portapapeles');
      this.showSuccessModal.set(true);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.errorMessage.set('Error al copiar al portapapeles');
      this.showErrorModal.set(true);
    });
  }
}
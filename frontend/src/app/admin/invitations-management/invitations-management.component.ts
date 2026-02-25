import { Component, OnInit, signal, inject } from '@angular/core';
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
  

  // Datos
  invitationsData = signal<InvitationResponse[]>([]);
  loading = signal(true);
  
  // Filtros
  selectedFilters = signal<InvitationsFilter>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
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
  
  // Ordenamiento
  sortOptions = [
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'expires_at', label: 'Fecha de expiración' },
    { value: 'test_title', label: 'Título del test' },
    { value: 'inviter_name', label: 'Creador' },
    { value: 'status', label: 'Estado' },
    { value: 'is_guest', label: 'Tipo de invitación' }
  ];
  
  // Estados disponibles
  statusOptions = [
    { value: 'undefined', label: 'Todos los estados' },
    { value: 'active', label: 'Activas' },
    { value: 'used', label: 'Usadas' },
    { value: 'expired', label: 'Expiradas' }
  ];

  // Mensajes Toast
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Memoria de filtros
  private readonly FILTER_STORAGE_KEY = 'invitations_filters';
  
  // --- SEÑALES PARA ELIMINACIÓN MASIVA ---
  selectedInvitations = signal<Set<number>>(new Set());
  isAllSelected = signal(false);
  isIndeterminate = signal(false);
  
  // Modales
  showDeleteModal = signal(false);
  showBulkDeleteModal = signal(false);
  deleteInProgress = signal(false);
  
  // Invitación individual para eliminar
  invitationToDelete = signal<InvitationResponse | null>(null);
  selectedCount = signal(0);
  
  // Mensajes del modal
  modalTitle = signal('');
  modalMessage = signal('');

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadInvitations();
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

  loadInvitations(): void {
    this.loading.set(true);
    
    this.invitationsService.getInvitations(this.selectedFilters()).subscribe({
      next: (res: InvitationsResponse) => {
        this.invitationsData.set(res.invitations);
        this.totalItems.set(res.pagination.total_items);
        this.totalPages.set(res.pagination.total_pages);
        this.hasMore.set(this.currentPage() < this.totalPages());
        
        this.loading.set(false);
        this.saveFilters();
        this.clearSelection();
      },
      error: (err) => {
        console.error('Error al cargar invitaciones:', err);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros
  onFilterChange(): void {
    this.selectedFilters.update(filters => ({ ...filters, page: 1 }));
    this.currentPage.set(1);
    this.loadInvitations();
  }

  resetFilters(): void {
    this.selectedFilters.set({
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
    this.currentPage.set(1);
    this.loadInvitations();
  }

  updateFilter<T extends keyof InvitationsFilter>(key: T, value: InvitationsFilter[T]): void {
    this.selectedFilters.update(filters => ({ ...filters, [key]: value }));
    if (key !== 'page') {
      this.onFilterChange();
    }
  }

  removeFilter(key: keyof InvitationsFilter): void {
    this.updateFilter(key, undefined);
    this.onFilterChange();
  }

  // Métodos para ordenamiento
  toggleSortOrder(): void {
    const currentOrder = this.selectedFilters().sort_order;
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
    this.currentPage.set(page);
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadInvitations();
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

  // --- MÉTODOS PARA ELIMINACIÓN MASIVA ---
  toggleInvitationSelection(invitationId: number): void {
    const selected = this.selectedInvitations();
    if (selected.has(invitationId)) {
      selected.delete(invitationId);
    } else {
      selected.add(invitationId);
    }
    this.selectedInvitations.set(new Set(selected));
    this.updateSelectionState();
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      const allIds = this.invitationsData().map(inv => inv.id);
      this.selectedInvitations.set(new Set(allIds));
      this.isAllSelected.set(true);
      this.isIndeterminate.set(false);
    }
    this.updateSelectedCount();
  }

  clearSelection(): void {
    this.selectedInvitations.set(new Set());
    this.isAllSelected.set(false);
    this.isIndeterminate.set(false);
    this.updateSelectedCount();
  }

  updateSelectionState(): void {
    const totalItems = this.invitationsData().length;
    const selectedCount = this.selectedInvitations().size;
    
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
    this.selectedCount.set(this.selectedInvitations().size);
  }

  // Métodos para eliminar
  confirmDeleteInvitation(invitation: InvitationResponse): void {
    this.invitationToDelete.set(invitation);
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar la invitación para el test "${invitation.test_title}"? Esta acción no se puede deshacer.`);
    this.showDeleteModal.set(true);
  }

  confirmBulkDelete(): void {
    if (this.selectedCount() === 0) return;
    
    this.modalTitle.set('Confirmar eliminación masiva');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar ${this.selectedCount()} invitación(es) seleccionada(s)? Esta acción no se puede deshacer.`);
    this.showBulkDeleteModal.set(true);
  }

  deleteInvitation(): void {
    const invitation = this.invitationToDelete();
    if (!invitation) return;
    
    this.deleteInProgress.set(true);
    
    this.invitationsService.deleteInvitation(invitation.id).subscribe({
      next: () => {
        this.invitationsData.update(invitations => 
          invitations.filter(i => i.id !== invitation.id)
        );
        
        this.totalItems.update(count => count - 1);
        this.showDeleteModal.set(false);
        this.invitationToDelete.set(null);
        this.deleteInProgress.set(false);
        
        this.successMessage.set(`Invitación eliminada correctamente.`);
      },
      error: (err) => {
        console.error('Error al eliminar invitación:', err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar la invitación. Por favor, inténtalo de nuevo.');
      }
    });
  }

  deleteSelectedInvitations(): void {
    const selectedIds = Array.from(this.selectedInvitations());
    if (selectedIds.length === 0) return;
    
    this.deleteInProgress.set(true);
    
    this.invitationsService.deleteInvitationsBulk(selectedIds).subscribe({
      next: (response) => {
        this.invitationsData.update(invitations => 
          invitations.filter(i => !selectedIds.includes(i.id))
        );
        
        this.totalItems.update(count => count - selectedIds.length);
        this.clearSelection();
        this.showBulkDeleteModal.set(false);
        this.deleteInProgress.set(false);
        
        this.successMessage.set(`${selectedIds.length} invitación(es) eliminada(s) correctamente.`);
        
        if (this.invitationsData().length === 0 && this.currentPage() > 1) {
          this.goToPage(this.currentPage() - 1);
        }
      },
      error: (err) => {
        console.error('Error al eliminar invitaciones:', err);
        this.deleteInProgress.set(false);
        this.errorMessage.set('Error al eliminar las invitaciones. Por favor, inténtalo de nuevo.');
      }
    });
  }

  // Método para mostrar perfil de usuario en el modal
  openUserProfile(userId: number): void {
    this.userModalService.open(userId);
  }

  isInvitationExpired(date: string): boolean {
    return new Date(date) < new Date();
  }

  // Métodos de utilidad
  getStatusBadgeClass(status: string): string {
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Activa';
      case 'used': return 'Usada';
      case 'expired': return 'Expirada';
      default: return 'Desconocido';
    }
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

  getCurrentSortLabel(): string {
    const sortBy = this.selectedFilters().sort_by;
    const option = this.sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Fecha de creación';
  }

  getSortOrderIcon(): string {
    const order = this.selectedFilters().sort_order;
    return order === 'asc' ? '↑' : '↓';
  }

  showFilterIndicators(): boolean {
    const filters = this.selectedFilters();
    return !!(
      filters.search || 
      filters.status ||
      filters.is_used !== undefined ||
      filters.is_guest !== undefined ||
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

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.successMessage.set('URL copiada al portapapeles');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.errorMessage.set('Error al copiar al portapapeles');
    });
  }

  closeToast() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
  }

}
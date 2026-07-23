import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../../shared/models/user.models';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UsersManagementService } from '../../services/users-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { UsersListFilters, UserListStats, UserList } from '../../models/user-list.models';
import { UserModalService } from '../../services/user-modal.service';
import { UserProfileModalComponent } from '../user-profile-modal.component/user-profile-modal.component';

@Component({
  selector: 'app-users-stats',
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterModule, ModalComponent, UserProfileModalComponent ],
  templateUrl: './users-list.component.html'
})
export class UsersListComponent implements OnInit {
  private usersManagementService = inject(UsersManagementService);
  private sharedUtilsService = inject(SharedUtilsService);
  private userModalService = inject(UserModalService);

  // Datos
  usersData = signal<UserList[]>([]);

  // Paginación
  totalPages = signal(0);
  hasMore = signal(false);

  // Estados
  loading = signal(true);
  loadingProfile = signal(false);  
  deleting = signal(false);
   
  // Filtros y ordenación
  availableFilters = signal<{roles: string[]}>({
    roles: ['admin','user','guest', 'deleted'],
  });

  private readonly defaultFilters: UsersListFilters = {
    page_size: 10,
    page: 1,
    ordering: 'registered_at',
    order_dir: 'desc',
    role: 'all',
    search: '',
  };
  selectedFilters = signal<UsersListFilters>(this.defaultFilters);

  // Estadísticas
  stats = signal<UserListStats>({
    total_filtered: 0,
    total_unfiltered: 0,
  });

  // Opciones de ordenación (para la UI)
  sortOptions = [
    { value: 'username', label: 'Nombre de usuario' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Rol' },
    { value: 'registered_at', label: 'Fecha de registro' },
    { value: 'login_at', label: 'Fecha login' },
    { value: 'tests_completed', label: 'Nº tests completados' },
    { value: 'average_score', label: 'Puntuación media' },
  ];

  // Estado de la UI
  showFilters = signal(false);

  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'admin_users_filters';

  // Computed properties
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'registered_at';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Fecha de registro';
  });

  // Computed: índices de paginación
  startIndex = computed(() => (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1);
  endIndex = computed(() => Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.stats().total_filtered));

  // Modal de confirmación
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);

  // Modal de perfil
  showProfileModal = signal(false);
  errorTitle = signal('');
  errorMessage = signal('');
  
  // Usuario seleccionado para eliminar
  userToDelete: { id: number | null, username: string } = { id: null, username: '' };
  userProfile = signal<User | null>(null);
  profileError = signal<string | null>(null);

  ngOnInit() {
    this.loadSavedFilters();
    this.loadUsers();
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

  loadUsers(): void {
    this.loading.set(true);
    
    // Construir el filtro para el servicio
    const raw = this.selectedFilters();
    const filter: UsersListFilters = {
      ...raw,                          // Copia todos los campos
      ordering: raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering,
    };

    this.usersManagementService.getUsersStats(filter).subscribe({
      next: (res) => { 
        this.usersData.set(res.data);
        this.hasMore.set(res.pagination.has_more);
        this.totalPages.set(res.pagination.total_pages);
        this.stats.set(res.stats);
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorTitle.set('Error al cargar la lista de usuarios');
        this.errorMessage.set(err.error?.error || err.message || 'Error desconocido');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }


  // --- Métodos de filtros ---
  updateFilter<K extends keyof UsersListFilters>(key: K, value: UsersListFilters[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      // Al cambiar cualquier filtro que no sea página, resetear a página 1
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadUsers();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadUsers();
  }

  removeFilter(key: keyof UsersListFilters): void {
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
    return !!(f.search || f.role);
  }

  showPagination(): boolean {
    return this.stats().total_filtered > 0 && this.totalPages() > 1;
  }

  // --- Métodos para la UI ---
  getSortOrderIcon(): string {
    return this.selectedFilters().order_dir === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedFilters().order_dir === 'asc' ? 'Ascendente' : 'Descendente';
  }


  // Método para cargar perfil de usuario
  loadUserProfile(userId: number): void {
    this.loadingProfile.set(true);
    this.profileError.set(null);
    
    this.usersManagementService.getUserProfile(userId).subscribe({
      next: (response) => {
        this.userProfile.set(response);
        this.showProfileModal.set(true);
        this.loadingProfile.set(false);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.profileError.set('No se pudo cargar el perfil del usuario');
        this.loadingProfile.set(false);
      }
    });
  }

  // Método para mostrar perfil de usuario en el modal
  openUserProfile(userId: number): void {
    this.userModalService.open(userId);
  }

  // Métodos de utilidad
  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  getRoleBadgeClass(role: string): string {
    return this.sharedUtilsService.getSharedRoleBadgeClass(role);
  }

  getScoreBadgeClass(score: number): string {
    return this.sharedUtilsService.getSharedScoreBadgeClass(score);
  }

  getStatusBadgeClass(status: string): string {
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
  }

  // Métodos para eliminar usuario
  prepareDeleteUser(user: UserList): void {
    this.userToDelete = { id: user.id, username: user.username };
    this.showDeleteModal.set(true);
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete.id) return;
    
    this.deleting.set(true);
    
    this.usersManagementService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.showSuccessModal.set(true);
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.errorTitle.set(err.error?.error || 'Error al eliminar el usuario');
        this.errorMessage.set(err.error?.message || 'Inténtalo de nuevo');
        this.showErrorModal.set(true);
      }
    });
  }

  cancelDeleteUser(): void {
    this.showDeleteModal.set(false);
    this.userToDelete = { id: null, username: '' };
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }
}
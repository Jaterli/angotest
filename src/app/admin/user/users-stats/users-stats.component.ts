import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../../shared/models/user.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UsersManagementService } from '../../services/users-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { UsersStatsFilters, UserStats } from '../../models/user-stats.models';

@Component({
  selector: 'app-users-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ModalComponent
  ],
  templateUrl: './users-stats.component.html'
})
export class UsersStatsComponent implements OnInit {
  private usersManagementService = inject(UsersManagementService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Datos
  currentPage = signal(1);
  totalFilteredUsers = signal(0);
  totalUsers = signal(0);
  usersData = signal<UserStats[]>([]);
  totalPages = signal(0);
  hasMore = signal(false);

  // Estados
  loading = signal(true);
  deleting = signal(false);
  loadingProfile = signal(false);  
   
  // Filtros y ordenación
  selectedFilters = signal<UsersStatsFilters>({
    page_size: 10,
    page: 1,
    sort_by: 'created_at',
    sort_order: 'desc',
    search: ''
  });

  // Opciones disponibles
  sortOptions = signal([
    { value: 'created_at', label: 'Fecha de registro' },
    { value: 'login_at', label: 'Último inicio de sesión' },    
    { value: 'username', label: 'Nombre de usuario' },
    { value: 'email', label: 'Email' },
    { value: 'tests_completed', label: 'Tests completados' },
    { value: 'average_score', label: 'Puntuación media' }
  ]);

  // Estado de la UI
  showFilters = signal(true);

  // Computed properties para el template
  currentSortLabel = computed(() => {
    const sortBy = this.selectedFilters().sort_by;
    const option = this.sortOptions().find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de registro';
  });

  getSortOrderIcon(): string {
    const order = this.selectedFilters().sort_order || 'desc';
    return order === 'asc' ? '↑' : '↓';
  }

  // Modal de confirmación
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showProfileModal = signal(false);
  errorMessage = signal('');
  
  // Usuario seleccionado para eliminar
  userToDelete: { id: number | null, username: string } = { id: null, username: '' };
  userProfile = signal<User | null>(null);
  profileError = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    
    this.usersManagementService.getUsersStats(this.selectedFilters()).subscribe({
      next: (res) => {
        this.usersData.set(res.users);
        this.totalFilteredUsers.set(res.stats.total_filtered_users);
        this.totalUsers.set(res.stats.total_users);
        this.currentPage.set(res.filters.page || 1);          
        this.totalPages.set(Math.ceil(res.stats.total_filtered_users / (this.selectedFilters().page_size || 20)));
        this.hasMore.set(this.currentPage() < this.totalPages());


        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage.set('Error al cargar la lista de usuarios');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros y ordenación
  onFilterChange(): void {
    this.selectedFilters.update(filters => ({ ...filters, page: 1 }));
    this.currentPage.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.selectedFilters.set({
      page: 1,
      page_size: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
      search: ''
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  updateFilter<T extends keyof UsersStatsFilters>(key: T, value: UsersStatsFilters[T]): void {
    this.selectedFilters.update(filters => ({ ...filters, [key]: value }));
    if (key !== 'page') {
      this.onFilterChange();
    }
  }

  removeFilter(key: keyof UsersStatsFilters): void {
    this.updateFilter(key, '');
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
    
    this.currentPage.set(page);
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadUsers();
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

  getStartIndex(): number {
    return ((this.currentPage() - 1) * (this.selectedFilters().page_size || 10)) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * (this.selectedFilters().page_size || 10), this.totalFilteredUsers());
  }

  // Métodos para mostrar filtros activos
  showFilterIndicators(): boolean {
    const filters = this.selectedFilters();
    return !!(filters.search);
  }

  showPagination(): boolean {
    return this.totalFilteredUsers() > 0 && this.totalPages() > 1;
  }

  // Método para cargar perfil de usuario
  loadUserProfile(userId: number): void {
    this.loadingProfile.set(true);
    this.profileError.set(null);
    
    this.usersManagementService.getUserProfile(userId).subscribe({
      next: (response) => {
        this.userProfile.set(response.user);
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

  // Método para mostrar perfil
  showProfile(user: UserStats): void {
    this.loadUserProfile(user.id);
  }

  // Método para cerrar modal de perfil
  closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.userProfile.set(null);
    this.profileError.set(null);
  }

  // Métodos de utilidad
  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  getScoreBadgeClass(score: number): string {
    return this.sharedUtilsService.getSharedScoreBadgeClass(score);
  }

  // Método para obtener el color según la puntuación
  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  // Métodos para eliminar usuario
  prepareDeleteUser(user: UserStats): void {
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
        this.errorMessage.set(err.error?.message || 'Error al eliminar el usuario');
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
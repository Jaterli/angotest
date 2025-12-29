import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User, UsersStatsFilters, UserStats } from '../../shared/models/user.model';
import { ModalComponent } from '../../shared/components/modal.component';
import { UsersManagementService } from '../services/users-management.service';

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

  // Datos
  users = signal<UserStats[]>([]);
  totalUsers = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);
  
  // Estados
  loading = signal(true);
  deleting = signal(false);
  loadingProfile = signal(false);  
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(10);
  
  // Filtros y ordenación
  filters = signal<UsersStatsFilters>({
    sort_by: 'created_at',
    sort_order: 'desc',
    search: ''
  });

  // Opciones disponibles
  sortOptions = signal([
    { value: 'created_at', label: 'Fecha de registro' },
    { value: 'username', label: 'Nombre de usuario' },
    { value: 'email', label: 'Email' },
    { value: 'tests_completed', label: 'Tests completados' },
    { value: 'average_score', label: 'Puntuación media' }
  ]);

  // Computed properties para el template
  currentSortLabel = computed(() => {
    const sortBy = this.filters().sort_by;
    const option = this.sortOptions().find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de registro';
  });

  currentSortOrderLabel = computed(() => {
    return this.filters().sort_order === 'asc' ? 'Ascendente' : 'Descendente';
  });

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
    
    const currentFilters = this.filters();
    const filtersWithPagination: UsersStatsFilters = {
      ...currentFilters,
      page: this.currentPage(),
      page_size: this.pageSize()
    };

    this.usersManagementService.getUsersStats(filtersWithPagination).subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.totalUsers.set(response.total_users);
        this.totalPages.set(response.total_pages);
        this.hasMore.set(response.has_more);
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
  showProfile(user: User): void {
    this.loadUserProfile(user.id);
  }

  // Método para cerrar modal de perfil
  closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.userProfile.set(null);
    this.profileError.set(null);
  }

  // Métodos para filtros y ordenación
  applyFilters(): void {
    this.currentPage.set(1); // Resetear a primera página
    this.loadUsers();
  }

  clearFilters(): void {
    this.filters.set({
      sort_by: 'created_at',
      sort_order: 'desc',
      search: ''
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSortChange(sortBy: string): void {
    const currentFilters = this.filters();
    const currentSortOrder = currentFilters.sort_order;
    
    // Si ya está ordenado por este campo, cambiar el orden
    if (currentFilters.sort_by === sortBy) {
      this.filters.set({
        ...currentFilters,
        sort_order: currentSortOrder === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Ordenar por nuevo campo (desc por defecto)
      this.filters.set({
        ...currentFilters,
        sort_by: sortBy,
        sort_order: 'desc'
      });
    }
    
    this.applyFilters();
  }


  // Métodos para la paginación
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.update(page => page + 1);
      this.loadUsers();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages();
    
    // Mostrar máximo 5 páginas
    let startPage = Math.max(1, this.currentPage() - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, this.totalUsers());
  }


  // Método para obtener el color según la puntuación
  getScoreClasses(score: number): string {
    if (score >= 80) {
      return 'text-emerald-600 dark:text-emerald-400 font-bold';
    } else if (score >= 60) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  }

  // Método para formatear la fecha
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Método para calcular la edad
  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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
        
        // Recargar la lista de usuarios
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
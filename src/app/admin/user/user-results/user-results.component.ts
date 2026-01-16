import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UserResultsService } from '../../services/user-results.service';
import { UsersManagementService } from '../../services/users-management.service';
import { UserResultDetail, UserResultsData, UserResultsFilters } from '../../models/user-results.model';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { UserResultDetailsModalService } from '../../services/user-result-details-modal.service';
import { UserResultDetailsModalComponent } from '../user-result-details-modal/user-result-details-modal.component';

@Component({
  selector: 'app-user-results',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ModalComponent,
    UserResultDetailsModalComponent 
  ],
  templateUrl: './user-results.component.html',
})
export class UserResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userResultsService = inject(UserResultsService);
  private sharedUtilsService = inject(SharedUtilsService);
  private usersManagementService = inject(UsersManagementService);
  private resultDetailsModalService = inject(UserResultDetailsModalService);

  // Señales
  loading = signal(true);
  loadingUser = signal(true);
  userId = signal<number | null>(null);
  user = signal<any>(null);
  userResults = signal<UserResultDetail[]>([]);
  resultsData = signal<UserResultsData | null>(null);
  
  // Filtros
  filters = signal<UserResultsFilters>({
    page: 1,
    page_size: 20,
    status: 'all',
    sort_by: 'updated_at',
    sort_order: 'desc'
  });

 
  // Modales
  showDeleteModal = signal(false);
  deleteInProgress = signal(false);
  
  // Mensajes del modal
  modalTitle = signal('');
  modalMessage = signal('');

  // Resultado individual para eliminar
  resultToDelete = signal<UserResultDetail | null>(null);

  // UI states - ELIMINAR showDetailsModal y resultDetails
  showFilters = signal(false);
  
  // Computed values
  totalUserResults = computed(() => this.resultsData()?.data.total_results || 0);
  totalPages = computed(() => this.resultsData()?.data.total_pages || 0);
  currentPage = computed(() => this.resultsData()?.data.current_page || 1);
  pageSize = computed(() => this.resultsData()?.data.page_size || 20);
  hasMore = computed(() => this.resultsData()?.data.has_more || false);
  
  stats = computed(() => this.resultsData()?.data.stats || null);
  appliedFilters = computed(() => this.resultsData()?.data.filters || null);

  // Opciones para filtros
  statusOptions = [
    { value: 'all', label: this.sharedUtilsService.getSharedStatusLabel('all') },
    { value: 'completed', label: this.sharedUtilsService.getSharedStatusLabel('completed') },
    { value: 'in_progress', label: this.sharedUtilsService.getSharedStatusLabel('in_progress') }
  ];

  sortOptions = [
    { value: 'updated_at', label: 'Fecha de Actualización' },
    { value: 'created_at', label: 'Fecha de Creación' },
    { value: 'title', label: 'Título' },
    { value: 'level', label: 'Nivel' },
    { value: 'average_score', label: 'Puntuación' },
    { value: 'time_taken', label: 'Tiempo' }
  ];
  levelOptions = this.sharedUtilsService.getSharedPredefinedLevels();
  mainTopicOptions = this.sharedUtilsService.getSharedMainTopics();

  // Computed properties para el template
  currentSortLabel = computed(() => {
    const sortBy = this.filters().sort_by;
    const option = this.sortOptions.find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de Actualización';
  });

  currentSortOrderLabel = computed(() => {
    return this.filters().sort_order === 'asc' ? 'Ascendente' : 'Descendente';
  });

  constructor() {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      if (userId) {
        this.userId.set(userId);
        this.loadUserProfile(userId);
        this.loadResults();
      }
    });
  }

  loadUserProfile(userId: number): void {
    this.loadingUser.set(true);
    this.usersManagementService.getUserProfile(userId).subscribe({
      next: (response) => {
        this.user.set(response.user);
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
    this.userResultsService.getUserResults(this.userId()!, this.filters()).subscribe({
      next: (res) => {
        this.resultsData.set(res);
        this.userResults.set(res.data.results);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros
  applyFilters(): void {
    this.filters.update(f => ({ ...f, page: 1 }));
    this.loadResults();
  }

  clearFilters(): void {
    this.filters.set({
      page: 1,
      page_size: 20,
      status: 'all',
      sort_by: 'updated_at',
      sort_order: 'desc'
    });
    this.loadResults();
  }

  onSortChange(sortBy: string): void {
    const currentFilters = this.filters();
    
    // Si ya está ordenado por este campo, cambiar el orden
    if (currentFilters.sort_by === sortBy) {
      this.filters.set({
        ...currentFilters,
        sort_order: currentFilters.sort_order === 'asc' ? 'desc' : 'asc',
        page: 1
      });
    } else {
      // Ordenar por nuevo campo
      this.filters.set({
        ...currentFilters,
        sort_by: sortBy,
        sort_order: 'desc',
        page: 1
      });
    }
    
    this.loadResults();
  }

  // Métodos para eliminar
  confirmDeleteResult(result: UserResultDetail): void {
    this.resultToDelete.set(result);
    this.modalTitle.set('Confirmar eliminación');
    this.modalMessage.set(`¿Estás seguro de que deseas eliminar el resultado con id "${result.result_id}" en el test "${result.title}"? Esta acción no se puede deshacer.`);
    this.showDeleteModal.set(true);
  }

  deleteResult(): void {
    const result = this.resultToDelete();
    if (!result) return;
    
    this.deleteInProgress.set(true);
    
    this.userResultsService.deleteResult(result.result_id).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.userResults.update(results => 
          results.filter(r => r.result_id !== result.result_id)
        );
        
        // Cerrar modal y resetear estado
        this.showDeleteModal.set(false);
        this.resultToDelete.set(null);
        this.deleteInProgress.set(false);
        
        // Mostrar mensaje de éxito
        alert(`Resultado eliminado correctamente.`);
      },
      error: (err) => {
        console.error('Error al eliminar resultado:', err);
        this.deleteInProgress.set(false);
        alert('Error al eliminar el resultado. Por favor, inténtalo de nuevo.');
      }
    });
  }

  // Métodos para paginación
  goToPage(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.loadResults();
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
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 2) {
        pages.push(total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(current - 2, current - 1, current, current + 1, current + 2);
      }
    }
    
    return pages;
  }

  // Método para mostrar detalles usando el servicio
  showResultDetails(result: UserResultDetail): void {
    if (!this.userId()) return;
    
    this.resultDetailsModalService.open(this.userId()!, result.result_id);
  }

  // Helper methods
  formatTimeTaken(seconds: number): string {
    return this.sharedUtilsService.formatTimeTaken(seconds);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  getScoreBgColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreBgColor(score);
  }

  getStatusColor(status: string): string {
    return this.sharedUtilsService.getSharedStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.sharedUtilsService.getSharedStatusLabel(status);
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.pageSize()) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalUserResults());
  }

  goBack(): void {
    this.router.navigate(['/admin/users/stats']);
  }

}
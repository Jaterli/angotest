import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { UserResultsService } from '../services/user-results.service';
import { UsersManagementService } from '../services/users-management.service';
import { UserResultDetail, UserResultsData, UserResultsFilters } from '../models/user-results.model';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';

@Component({
  selector: 'app-user-results',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './user-results.component.html',
})
export class UserResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userResultsService = inject(UserResultsService);
  private sharedUtilsService = inject(SharedUtilsService);
  private usersManagementService = inject(UsersManagementService);

  // Señales
  loading = signal(true);
  loadingUser = signal(true);
  userId = signal<number | null>(null);
  user = signal<any>(null);
  results = signal<UserResultDetail[]>([]);
  resultsData = signal<UserResultsData | null>(null);
  
  // Filtros
  filters = signal<UserResultsFilters>({
    page: 1,
    page_size: 20,
    status: 'all',
    sort_by: 'updated_at',
    sort_order: 'desc'
  });

  // UI states
  showFilters = signal(false);
  showDetailsModal = signal(false);
  selectedResult = signal<any>(null);
  resultDetails = signal<any>(null);
  loadingDetails = signal(false);

  // Computed values
  totalResults = computed(() => this.resultsData()?.results.total_results || 0);
  totalPages = computed(() => this.resultsData()?.results.total_pages || 0);
  currentPage = computed(() => this.resultsData()?.results.current_page || 1);
  pageSize = computed(() => this.resultsData()?.results.page_size || 20);
  hasMore = computed(() => this.resultsData()?.results.has_more || false);
  
  stats = computed(() => this.resultsData()?.results.stats || null);
  appliedFilters = computed(() => this.resultsData()?.results.filters || null);

  // Opciones para filtros
  statusOptions = [
    { value: 'all', label: this.sharedUtilsService.getSharedStatusText('all') },
    { value: 'completed', label: this.sharedUtilsService.getSharedStatusText('completed') },
    { value: 'in_progress', label: this.sharedUtilsService.getSharedStatusText('in_progress') }
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
      next: (data) => {
        this.resultsData.set(data);
        this.results.set(data.results.results);
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

  // Métodos para mostrar detalles
  showResultDetails(result: UserResultDetail): void {
    this.selectedResult.set(result);
    this.loadingDetails.set(true);
    this.showDetailsModal.set(true);
    
    this.userResultsService.getResultDetails(this.userId()!, result.result_id).subscribe({
      next: (details) => {
        this.resultDetails.set(details);
        this.loadingDetails.set(false);
      },
      error: (error) => {
        console.error('Error loading result details:', error);
        this.loadingDetails.set(false);
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedResult.set(null);
    this.resultDetails.set(null);
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

  getStatusText(status: string): string {
    return this.sharedUtilsService.getSharedStatusText(status);
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.pageSize()) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalResults());
  }

  goBack(): void {
    this.router.navigate(['/admin/users/stats']);
  }

  // Métodos helper para respuestas
  getAnswerClasses(answer: any, userAnswerId: number, correctAnswerId: number): string {
    if (answer.id === correctAnswerId) {
      return 'answer-correct';
    }
    if (answer.id === userAnswerId && answer.id !== correctAnswerId) {
      return 'answer-incorrect';
    }
    if (answer.id === userAnswerId) {
      return 'answer-selected';
    }
    return 'answer-normal';
  }

  getAnswerTextClasses(answer: any, userAnswerId: number, correctAnswerId: number): string {
    if (answer.id === correctAnswerId) {
      return 'text-emerald-700 dark:text-emerald-300 font-medium';
    }
    if (answer.id === userAnswerId && answer.id !== correctAnswerId) {
      return 'text-red-700 dark:text-red-300 font-medium';
    }
    return 'text-gray-700 dark:text-gray-300';
  }

  // Método para obtener respuesta correcta
  getCorrectAnswerText(question: any): string {
    if (!question || !question.answers) return '';
    const correctAnswer = question.answers.find((a: any) => a.id === question.correct_answer_id);
    return correctAnswer ? correctAnswer.answer_text : '';
  }
}
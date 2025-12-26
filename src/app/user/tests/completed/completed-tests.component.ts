import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../shared/services/test.service';
import { AuthService } from '../../../shared/services/auth.service';
import { User } from '../../../models/user.model';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { 
  CompletedTestResponse, 
  CompletedTestsStats,
  CompletedTestsFilter 
} from '../../../models/test.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { ResultService } from '../../../shared/services/result.service';

@Component({
  selector: 'app-completed-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './completed-tests.component.html',
})
export class CompletedTestsComponent implements OnInit {
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private resultService = inject(ResultService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Tests y estado
  tests = signal<CompletedTestResponse[]>([]);
  loading = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<CompletedTestsFilter["sort_by"]>('updated_at');
  selectedSortOrder = signal<'asc' | 'desc'>('desc');
  selectedPageSize = signal<number>(10);
  
  mainTopics = signal<string[]>([]);
  levels = signal<string[]>([]);
  
  // Paginación
  currentPage = signal(1);
  totalTests = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);
  
  // Estadísticas
  stats = signal<CompletedTestsStats | null>(null);
  
  // Usuario
  currentUser: User | null = null;
  
  // Estado de la UI
  showFilters = signal(false);
  
  // Modal para revisar respuestas
  showReviewModal = signal(false);
  reviewLoading = signal(false);
  reviewError = signal<string>('');
  
  // Datos para el modal
  selectedResult: any = null;
  incorrectQuestions = signal<any[]>([]);
  reviewSummary = signal<any>(null);
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'completed_tests_filters';
  
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSavedFilters();
    this.loadTests();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.currentUser = currentUser;
    }
  }

  loadSavedFilters(): void {
    try {
      const savedFilters = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        this.selectedMainTopic.set(filters.mainTopic || 'all');
        this.selectedLevel.set(filters.level || 'all');
        this.selectedSortBy.set(filters.sortBy || 'date');
        this.selectedSortOrder.set(filters.sortOrder || 'desc');
        this.selectedPageSize.set(filters.pageSize || 10);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  saveFilters(): void {
    const filters = {
      mainTopic: this.selectedMainTopic(),
      level: this.selectedLevel(),
      sortBy: this.selectedSortBy(),
      sortOrder: this.selectedSortOrder(),
      pageSize: this.selectedPageSize(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }

  loadTests(): void {
    this.loading.set(true);
    
    const filter: CompletedTestsFilter = {
      page: this.currentPage(),
      page_size: this.selectedPageSize(),
      main_topic: this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      level: this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      sort_by: this.selectedSortBy(),
      sort_order: this.selectedSortOrder()
    };

    this.testService.getMyCompletedTests(filter).subscribe({
      next: (res) => {
        this.tests.set(res.data.tests);
        this.totalTests.set(res.data.total_tests);
        this.totalPages.set(res.data.total_pages);
        this.currentPage.set(res.data.current_page);
        this.hasMore.set(res.data.has_more);
        this.stats.set(res.stats);
        
        if (this.currentPage() === 1) {
          this.mainTopics.set(res.data.main_topics);
          this.levels.set(res.data.levels);
        }
        
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error al cargar tests completados:', err);
        this.loading.set(false);
      }
    });
  }

  // Método para abrir modal de revisión
  openReviewModal(test: CompletedTestResponse): void {
    this.selectedResult = test;
    this.reviewLoading.set(true);
    this.reviewError.set('');
    this.showReviewModal.set(true);
    
    // Cargar respuestas incorrectas
    this.resultService.getIncorrectAnswers(test.id).subscribe({
      next: (response) => {
        this.incorrectQuestions.set(response.incorrect_questions || []);
        this.reviewSummary.set(response.summary || null);
        this.reviewLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar respuestas incorrectas:', err);
        this.reviewError.set('No se pudieron cargar las respuestas incorrectas.');
        this.reviewLoading.set(false);
      }
    });
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.selectedResult = null;
    this.incorrectQuestions.set([]);
    this.reviewSummary.set(null);
    this.reviewError.set('');
  }

  // Resto de métodos permanecen igual...
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadTests();
  }

  resetFilters(): void {
    this.selectedMainTopic.set('all');
    this.selectedLevel.set('all');
    this.selectedSortBy.set('updated_at');
    this.selectedSortOrder.set('desc');
    this.selectedPageSize.set(10);
    this.currentPage.set(1);
    this.onFilterChange();
  }

  toggleSortOrder(): void {
    this.selectedSortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
    this.currentPage.set(1);
    this.loadTests();
  }

  removeFilter(filterType: 'main_topic' | 'level'): void {
    if (filterType === 'main_topic') {
      this.selectedMainTopic.set('all');
    } else if (filterType === 'level') {
      this.selectedLevel.set('all');
    }
    this.currentPage.set(1);
    this.loadTests();
  }

  setPageSize(size: number): void {
    this.selectedPageSize.set(size);
    this.currentPage.set(1);
    this.loadTests();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadTests();
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

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getAccuracyColor(accuracy: number): string {
    return this.sharedUtilsService.getSharedAccuracyColor(accuracy);
  }

  getScoreBadgeClass(score: number): string {
    return this.sharedUtilsService.getSharedScoreBadgeClass(score);
  }

  getScoreMessage(score: number): string {
    return this.sharedUtilsService.getSharedScoreMessage(score);
  }

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  getSortOrderIcon(): string {
    return this.selectedSortOrder() === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedSortOrder() === 'asc' ? 'Ascendente' : 'Descendente';
  }

  getAverageTimePerTest(): string {
    const stats = this.stats();
    if (!stats || stats.total_tests === 0) return 'N/A';
    const avgTime = stats.total_time_spent / stats.total_tests;
    return this.formatTime(Math.round(avgTime));
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.selectedPageSize()) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * this.selectedPageSize(), this.totalTests());
  }

  getCurrentSortLabel(): string {
    switch (this.selectedSortBy()) {
      case 'test_title': return 'Título del test';
      case 'test_date': return 'Fecha del test';
      case 'started_at': return 'Fecha de inicio';
      case 'updated_at': return 'Fecha de finalización';      
      case 'time_taken': return 'Tiempo empleado';
      case 'score': return 'Puntuación';
      default: return 'Fecha de finalización';
    }
  }

  showFilterIndicators(): boolean {
    return this.selectedMainTopic() !== 'all' || this.selectedLevel() !== 'all';
  }

  showPagination(): boolean {
    return this.totalTests() > 0 && this.totalPages() > 1;
  }
  
  // Métodos para el modal
  hasIncorrectQuestions(): boolean {
    return this.incorrectQuestions().length > 0;
  }
  
  getQuestionNumber(index: number): string {
    return `Pregunta ${index + 1}`;
  }
}
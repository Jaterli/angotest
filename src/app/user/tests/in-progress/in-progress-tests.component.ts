import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../shared/services/test.service';
import { AuthService } from '../../../shared/services/auth.service';
import { User } from '../../../models/user.model';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { 
  InProgressTestResponse, 
  InProgressTestsStats,
  InProgressTestsFilter 
} from '../../../models/test.model';

@Component({
  selector: 'app-in-progress-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './in-progress-tests.component.html',
})
export class InProgressTestsComponent implements OnInit {
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Tests y estado
  tests = signal<InProgressTestResponse[]>([]);
  loading = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<InProgressTestsFilter["sort_by"]>('updated_at');
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
  stats = signal<InProgressTestsStats | null>(null);
  
  // Usuario
  currentUser: User | null = null;
  
  // Estado de la UI
  showFilters = signal(false);
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'in_progress_tests_filters';
  
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
        this.selectedSortBy.set(filters.sortBy || 'updated');
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
    
    const filter: InProgressTestsFilter = {
      page: this.currentPage(),
      page_size: this.selectedPageSize(),
      main_topic: this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      level: this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      sort_by: this.selectedSortBy(),
      sort_order: this.selectedSortOrder()
    };

    this.testService.getMyInProgressTests(filter).subscribe({
      next: (res) => {
        this.tests.set(res.data.tests);
        this.totalTests.set(res.data.total_tests);
        this.totalPages.set(res.data.total_pages);
        this.currentPage.set(res.data.current_page);
        this.hasMore.set(res.data.has_more);
        this.stats.set(res.stats);
        
        // Actualizar opciones de filtros si es la primera página
        if (this.currentPage() === 1) {
          this.mainTopics.set(res.data.main_topics || []);
          this.levels.set(res.data.levels || []);
        }
        
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error al cargar tests en progreso:', err);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros
  onFilterChange(): void {
    // Resetear a página 1 cuando cambian los filtros
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

  // Métodos para paginación
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

  // Métodos compartidos del servicio de utilidades
  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (progress >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (progress >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getProgressBarColor(progress: number): string {
    if (progress >= 75) return 'bg-emerald-500 dark:bg-emerald-500';
    if (progress >= 50) return 'bg-yellow-500 dark:bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500 dark:bg-orange-500';
    return 'bg-red-500 dark:bg-red-500';
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

  // Métodos específicos para tests en progreso
  getProgressMessage(progress: number): string {
    if (progress === 0) return 'Recién comenzado';
    if (progress < 25) return 'En las primeras preguntas';
    if (progress < 50) return 'Menos de la mitad';
    if (progress < 75) return 'Más de la mitad';
    if (progress < 100) return 'Casi terminado';
    return 'Listo para finalizar';
  }

  calculateProgress(test: InProgressTestResponse): number {
    if (!test.total_questions || test.total_questions === 0) return 0;
    return Math.round((test.answered_count / test.total_questions) * 100);
  }

  getRemainingQuestions(test: InProgressTestResponse): number {
    return test.total_questions - test.answered_count;
  }

  getEstimatedTimeToComplete(test: InProgressTestResponse): string {
    if (!test.answered_count || test.answered_count === 0 || !test.time_taken) return 'N/A';
    
    // Calcular tiempo promedio por pregunta
    const timePerQuestion = test.time_taken / test.answered_count;
    const remainingQuestions = this.getRemainingQuestions(test);
    const estimatedTime = timePerQuestion * remainingQuestions;
    
    return this.formatTime(Math.round(estimatedTime));
  }

  getAverageProgress(): number {
    const stats = this.stats();
    if (!stats || stats.total_in_progress === 0) return 0;
    
    return Math.round((stats.total_questions_answered / 50) * 100);//stats.total_questions) * 100);
  }

  getSortOrderIcon(): string {
    return this.selectedSortOrder() === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedSortOrder() === 'asc' ? 'Ascendente' : 'Descendente';
  }

  getCurrentSortLabel(): string {
    switch (this.selectedSortBy()) {
      case 'progress': return 'Progreso';
      case 'test_date': return 'Fecha del test';
      case 'started_at': return 'Fecha de inicio';
      case 'updated_at': return 'Última actualización';      
      case 'time_taken': return 'Tiempo empleado';
      case 'level': return 'Nivel';
      case 'remaining_count': return 'Preguntas restantes';
      default: return 'Última actualización';
    }
  }

  showFilterIndicators(): boolean {
    return this.selectedMainTopic() !== 'all' || this.selectedLevel() !== 'all';
  }

  showPagination(): boolean {
    return this.totalTests() > 0 && this.totalPages() > 1;
  }

  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.selectedPageSize()) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * this.selectedPageSize(), this.totalTests());
  }

  // Acciones específicas
  deleteTestProgress(testId: number): void {
    if (confirm('¿Estás seguro de que quieres reiniciar este test? Se perderá todo el progreso.')) {
      this.testService.deleteTestProgress(testId).subscribe({
        next: () => {
          // Remover el test de la lista
          this.tests.update(tests => tests.filter(t => t.test_id !== testId));
          // Recargar para actualizar estadísticas
          this.loadTests();
        },
        error: (err) => {
          console.error('Error al eliminar progreso:', err);
          alert('Error al reiniciar el test. Inténtalo de nuevo.');
        }
      });
    }
  }

}
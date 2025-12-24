import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../shared/services/test.service';
import { NotStartedTestsResponse, TestWithStatus } from '../../../models/test.model';
import { AuthService } from '../../../shared/services/auth.service';
import { User } from '../../../models/user.model';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

@Component({
  selector: 'app-not-started-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './not-started-tests.component.html',
})
export class NotStartedTestsComponent implements OnInit {
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Tests y estado
  tests = signal<TestWithStatus[]>([]);
  loading = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<'date' | 'questions' | 'title'>('date');
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
  stats = signal({
    total_tests: 0,
    total_questions: 0,
    average_questions: 0,
    levels_distribution: {
      principiante: 0,
      intermedio: 0,
      avanzado: 0
    }
  });
  
  // Usuario
  currentUser: User | null = null;
  
  // Estado de la UI
  showFilters = signal(false);
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'not_started_tests_filters';

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

    this.testService.getNotStartedTests(
      this.currentPage(),
      this.selectedPageSize(),
      this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      this.selectedSortBy(),
      this.selectedSortOrder() === 'asc' ? 'asc' : 'desc'
    ).subscribe({
      next: (res: NotStartedTestsResponse) => {
        this.tests.set(res.tests);
        this.totalTests.set(res.total_tests);
        this.totalPages.set(res.total_pages);
        this.currentPage.set(res.current_page);
        this.hasMore.set(res.has_more);
        
        // Actualizar opciones de filtros si es la primera página
        if (this.currentPage() === 1) {
          this.mainTopics.set(res.main_topics);
          this.levels.set(res.levels);
          
          // Calcular estadísticas
          this.calculateStats(res.tests);
        }
        
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error al cargar tests:', err);
        this.loading.set(false);
      }
    });
  }

  private calculateStats(tests: TestWithStatus[]): void {
    const totalQuestions = tests.reduce((sum, test) => sum + (test.total_questions || 0), 0);
    const levelsDist = { principiante: 0, intermedio: 0, avanzado: 0 };
    
    tests.forEach(test => {
      const level = test.level?.toLowerCase() || '';
      if (level.includes('principiante')) levelsDist.principiante++;
      else if (level.includes('intermedio')) levelsDist.intermedio++;
      else if (level.includes('avanzado')) levelsDist.avanzado++;
    });
    
    this.stats.set({
      total_tests: tests.length,
      total_questions: totalQuestions,
      average_questions: tests.length > 0 ? totalQuestions / tests.length : 0,
      levels_distribution: levelsDist
    });
  }
  
  getStatusBadgeClass(status:string){
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
  }

  getLevelBadgeClass(level:string){
     return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getStatusText(status:string){
    return this.sharedUtilsService.getSharedStatusText(status);
  }

  getPageNumbers(){
    return this.sharedUtilsService.getSharedPageNumbers(this.totalPages(),this.currentPage());
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
    this.selectedSortBy.set('date');
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


  getStartIndex(): number {
    return ((this.currentPage() - 1) * this.selectedPageSize()) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage() * this.selectedPageSize(), this.totalTests());
  }

  getCurrentSortLabel(): string {
    switch (this.selectedSortBy()) {
      case 'date': return 'Fecha de creación';
      case 'questions': return 'Número de preguntas';
      case 'title': return 'Título';
      default: return 'Fecha de creación';
    }
  }

  getSortOrderIcon(): string {
    return this.selectedSortOrder() === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedSortOrder() === 'asc' ? 'Ascendente' : 'Descendente';
  }

  showFilterIndicators(): boolean {
    return this.selectedMainTopic() !== 'all' || this.selectedLevel() !== 'all';
  }

  showPagination(): boolean {
    return this.totalTests() > 0 && this.totalPages() > 1;
  }

}
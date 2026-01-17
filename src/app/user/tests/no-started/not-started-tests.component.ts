import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../shared/services/test.service';
import { TestWithStatus,  NotStartedTestsFilter, Test, } from '../../../shared/models/test.model';
import { AuthService } from '../../../shared/services/auth.service';
import { User } from '../../../shared/models/user.model';
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
  tests = signal<Test[]>([]);
  loading = signal(true);
  
  // Filtros - usando NotStartedTestsFilter
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<NotStartedTestsFilter["sort_by"]>('test_created_at');
  selectedSortOrder = signal<'asc' | 'desc'>('desc');
  selectedPageSize = signal<number>(10);
  
  mainTopics = signal<string[]>([]);
  levelOptions = this.sharedUtilsService.getSharedPredefinedLevels();
  
  // Paginación
  currentPage = signal(1);
  totalTests = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);
  
  // Estadísticas
  stats = signal({
    total_tests: 0,
    total_tests_with_filters: 0,
    total_by_level: {
      Principiante: 0,
      Intermedio: 0,
      Avanzado: 0
    },

  });
  
  mainTopicsCount = signal(0);

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
        this.selectedSortBy.set(filters.sortBy || 'created_at');
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

    const filter: NotStartedTestsFilter = {
      page: this.currentPage(),
      page_size: this.selectedPageSize(),
      main_topic: this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      level: this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      sort_by: this.selectedSortBy(),
      sort_order: this.selectedSortOrder()
    };

    // Necesitamos crear un método en TestService para usar NotStartedTestsFilter
    this.testService.getNotStartedTests(filter).subscribe({
      next: (res) => {
        // Manejar tanto la respuesta antigua como la nueva estructura
        this.tests.set(res.data.tests);
        this.totalTests.set(res.data.total_tests);
        this.totalPages.set(res.data.total_pages);
        this.currentPage.set(res.data.current_page);
        this.hasMore.set(res.data.has_more);
        this.mainTopics.set(res.data.main_topics);
        this.stats.set(res.stats);   
        
        this.loading.set(false);
        this.saveFilters();
      },
      error: (err) => {
        console.error('Error al cargar tests:', err);
        this.loading.set(false);
      }
    });
  }
  
  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(this.totalPages(), this.currentPage());
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
    this.selectedSortBy.set('test_created_at');
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
      case 'test_created_at': return 'Fecha de creación';
      case 'test_title': return 'Título';
      case 'test_level': return 'Nivel de dificultad';
      case 'questions': return 'Número de preguntas';
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

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }
}
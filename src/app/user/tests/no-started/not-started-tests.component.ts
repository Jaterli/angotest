import { Component, OnInit, OnDestroy, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';
import { TestWithStatus, NotStartedTestsResponse } from '../../../models/test.model';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-not-started-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './not-started-tests.component.html',
})
export class NotStartedTestsComponent implements OnInit, OnDestroy {
  private testService = inject(TestService);
  private authService = inject(AuthService);

  // Tests y estado
  tests = signal<TestWithStatus[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  mainTopics = signal<string[]>([]);
  levels = signal<string[]>([]);
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(10);
  totalTests = signal(0);
  
  // Usuario
  currentUser: User | null = null;
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'test_filters';
  
  // Para evitar múltiples llamadas durante scroll
  private isFetching = false;
  
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSavedFilters();
    this.loadTests();
  }
  
  ngOnDestroy(): void {
    this.saveFilters();
  }
  
  @HostListener('window:scroll')
  onScroll(): void {
    if (this.shouldLoadMore()) {
      this.loadMoreTests();
    }
  }
  
  private shouldLoadMore(): boolean {
    if (this.loading() || this.loadingMore() || !this.hasMore() || this.isFetching) {
      return false;
    }
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 500; // 500px antes del final
    
    return scrollPosition >= threshold;
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
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }
  
  saveFilters(): void {
    const filters = {
      mainTopic: this.selectedMainTopic(),
      level: this.selectedLevel(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }
  
  loadTests(reset: boolean = true): void {
    if (reset) {
      this.currentPage.set(1);
      this.tests.set([]);
      this.hasMore.set(true);
    }
    
    this.loading.set(true);
    this.isFetching = true;
    
    this.testService.getNotStartedTests(
      this.currentPage(),
      this.pageSize(),
      this.selectedMainTopic(),
      this.selectedLevel()
    ).subscribe({
      next: (res: NotStartedTestsResponse) => {
        if (reset) {
          this.tests.set(res.tests);
        } else {
          this.tests.update(current => [...current, ...res.tests]);
        }
        
        this.hasMore.set(res.has_more);
        this.totalTests.set(res.total_tests);
        
        // Actualizar opciones de filtros si es la primera página
        if (this.currentPage() === 1) {
          this.mainTopics.set(['all', ...res.main_topics]);
          this.levels.set(['all', ...res.levels]);
        }
        
        this.loading.set(false);
        this.loadingMore.set(false);
        this.isFetching = false;
      },
      error: err => {
        console.error('Error al cargar tests:', err);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.isFetching = false;
      }
    });
  }
  
  loadMoreTests(): void {
    if (!this.hasMore() || this.loadingMore() || this.isFetching) {
      return;
    }
    
    this.loadingMore.set(true);
    this.currentPage.update(page => page + 1);
    this.loadTests(false);
  }
  
  onFilterChange(): void {
    this.saveFilters();
    this.loadTests(true);
  }
  
  resetFilters(): void {
    this.selectedMainTopic.set('all');
    this.selectedLevel.set('all');
    this.onFilterChange();
  }
  
  getLevelBadgeClass(level: string): string {
    if (!level) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    
    switch (level?.toLowerCase()) {
      case 'principiante':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      case 'intermedio':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'avanzado':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'not_started':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'in_progress': return 'En progreso';
      case 'not_started': return 'Por hacer';
      default: return status;
    }
  }
}
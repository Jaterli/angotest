import { Component, OnInit, OnDestroy, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';
import { 
  CompletedTestResponse, 
  CompletedTestsStats,
  CompletedTestsFilter 
} from '../../../models/test.model';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-completed-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './completed-tests.component.html',
})
export class CompletedTestsComponent implements OnInit, OnDestroy {
  private testService = inject(TestService);
  private authService = inject(AuthService);

  // Tests y estado
  tests = signal<CompletedTestResponse[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<'score' | 'date' | 'time'>('date');
  selectedSortOrder = signal<'asc' | 'desc'>('desc');
  
  mainTopics = signal<string[]>([]);
  levels = signal<string[]>([]);
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(10);
  totalTests = signal(0);
  
  // Estadísticas
  stats = signal<CompletedTestsStats | null>(null);
  
  // Usuario
  currentUser: User | null = null;
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'completed_tests_filters';
  
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
    const threshold = document.body.offsetHeight - 500;
    
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
        this.selectedSortBy.set(filters.sortBy || 'date');
        this.selectedSortOrder.set(filters.sortOrder || 'desc');
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
    
    const filter: CompletedTestsFilter = {
      page: this.currentPage(),
      page_size: this.pageSize(),
      main_topic: this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      level: this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      sort_by: this.selectedSortBy(),
      sort_order: this.selectedSortOrder()
    };
    
    this.testService.getMyCompletedTests(filter).subscribe({
      next: (res) => {
        if (reset) {
          this.tests.set(res.data.tests);
        } else {
          this.tests.update(current => [...current, ...res.data.tests]);
        }
        
        this.hasMore.set(res.data.has_more);
        this.totalTests.set(res.data.total_tests);
        this.stats.set(res.stats);
        
        // Actualizar opciones de filtros si es la primera página
        if (this.currentPage() === 1) {
          this.mainTopics.set(['all', ...res.data.main_topics]);
          this.levels.set(['all', ...res.data.levels]);
        }
        
        this.loading.set(false);
        this.loadingMore.set(false);
        this.isFetching = false;
      },
      error: err => {
        console.error('Error al cargar tests completados:', err);
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
    this.selectedSortBy.set('date');
    this.selectedSortOrder.set('desc');
    this.onFilterChange();
  }
  
  toggleSortOrder(): void {
    this.selectedSortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
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
  
  getScoreBadgeClass(score: number): string {
    if (score >= 80) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    } else if (score >= 60) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }
  }
  
  getScoreMessage(score: number): string {
    if (score >= 90) return '¡Excelente!';
    if (score >= 80) return 'Muy bien';
    if (score >= 70) return 'Buen trabajo';
    if (score >= 60) return 'Aprobado';
    if (score >= 50) return 'Necesitas mejorar';
    return 'Requiere repaso';
  }
  
  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (accuracy >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  
  getAverageTimePerTest(): string {
    const stats = this.stats();
    if (!stats || stats.total_tests === 0) return 'N/A';
    
    const avgTime = stats.total_time_spent / stats.total_tests;
    return this.formatTime(Math.round(avgTime));
  }
}
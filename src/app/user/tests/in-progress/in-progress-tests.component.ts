import { Component, OnInit, OnDestroy, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';
import { 
  InProgressTestResponse, 
  InProgressTestsStats,
  InProgressTestsFilter 
} from '../../../models/test.model';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-in-progress-tests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './in-progress-tests.component.html',
})
export class InProgressTestsComponent implements OnInit, OnDestroy {
  private testService = inject(TestService);
  private authService = inject(AuthService);

  // Tests y estado
  tests = signal<InProgressTestResponse[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  
  // Filtros
  selectedMainTopic = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedSortBy = signal<'progress' | 'date' | 'updated'>('updated');
  selectedSortOrder = signal<'asc' | 'desc'>('desc');
  
  mainTopics = signal<string[]>([]);
  levels = signal<string[]>([]);
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(10);
  totalTests = signal(0);
  
  // Estadísticas
  stats = signal<InProgressTestsStats | null>(null);
  
  // Usuario
  currentUser: User | null = null;
  
  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'in_progress_tests_filters';
  
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
        this.selectedSortBy.set(filters.sortBy || 'updated');
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
    
    const filter: InProgressTestsFilter = {
      page: this.currentPage(),
      page_size: this.pageSize(),
      main_topic: this.selectedMainTopic() !== 'all' ? this.selectedMainTopic() : undefined,
      level: this.selectedLevel() !== 'all' ? this.selectedLevel() : undefined,
      sort_by: this.selectedSortBy(),
      sort_order: this.selectedSortOrder()
    };
    
    this.testService.getMyInProgressTests(filter).subscribe({
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
        console.error('Error al cargar tests en progreso:', err);
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
    this.selectedSortBy.set('updated');
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
  
  getProgressMessage(progress: number): string {
    if (progress === 0) return 'Recién comenzado';
    if (progress < 25) return 'En las primeras preguntas';
    if (progress < 50) return 'Menos de la mitad';
    if (progress < 75) return 'Más de la mitad';
    if (progress < 100) return 'Casi terminado';
    return 'Listo para finalizar';
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  
  getRemainingTimeEstimate(test: InProgressTestResponse): string {
    if (test.answered_count === 0 || !test.time_spent) return 'N/A';
    
    // Calcular tiempo promedio por pregunta
    const timePerQuestion = test.time_taken / test.answered_count;
    const estimatedTime = timePerQuestion * test.remaining_count;
    
    return this.formatTime(Math.round(estimatedTime));
  }
  
  deleteTestProgress(testId: number): void {
    if (confirm('¿Estás seguro de que quieres reiniciar este test? Se perderá todo el progreso.')) {
      this.testService.deleteTestProgress(testId).subscribe({
        next: () => {
          // Remover el test de la lista
          this.tests.update(tests => tests.filter(t => t.test_id !== testId));
          // Actualizar estadísticas
          this.loadTests(true);
        },
        error: (err) => {
          console.error('Error al eliminar progreso:', err);
          alert('Error al reiniciar el test. Inténtalo de nuevo.');
        }
      });
    }
  }
}
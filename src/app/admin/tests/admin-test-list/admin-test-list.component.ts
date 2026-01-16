import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestWithCount } from '../../../shared/models/test.model';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { TestsFilterOptions, TestsListFilters } from '../../models/admin-tests.models';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

@Component({
  selector: 'app-admin-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './admin-test-list.component.html',
})
export class AdminTestListComponent implements OnInit {
  private testsManagementService = inject(TestsManagementService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Datos
  tests = signal<TestWithCount[]>([]);
  totalTests = signal(0);
  totalPages = signal(0);
  hasMore = signal(false);
  
  // Estados
  loading = signal(true);
  loadingOptions = signal(false);
  deleting = signal(false);
  
  // Filtros y ordenación
  selectedFilters = signal<TestsListFilters>({
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    main_topic: '',
    sub_topic: '',
    level: '',
    search: ''
  });

  // Opciones de filtrado
  filterOptions = signal<TestsFilterOptions>({
    main_topics: [],
    sub_topics: [],
    levels: [],
  });

  // Opciones de ordenación
  sortOptions = [
    { value: 'title', label: 'Título' },
    { value: 'main_topic', label: 'Tema principal' },
    { value: 'sub_topic', label: 'Subtema' },
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'updated_at', label: 'Fecha de actualización' },
    { value: 'level', label: 'Nivel' },
  ];

  // Estado de la UI
  showFilters = signal(true);

  // Computed properties
  currentSortLabel = computed(() => {
    const sortBy = this.selectedFilters().sort_by;
    const option = this.sortOptions.find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de creación';
  });

  getSortOrderIcon(): string {
    const order = this.selectedFilters().sort_order || 'desc';
    return order === 'asc' ? '↑' : '↓';
  }

  // Modal de confirmación
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  
  // Información del test a eliminar
  testToDelete: { id: number | null, title: string | null } = { id: null, title: null };
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadTests();
  }

  loadFilterOptions(): void {
    this.loadingOptions.set(true);
    this.testsManagementService.getFilterOptions().subscribe({
      next: (options) => {
        this.filterOptions.set(options);
        this.loadingOptions.set(false);
      },
      error: (err) => {
        console.error('Error al cargar opciones de filtro:', err);
        this.loadingOptions.set(false);
      }
    });
  }

  loadTests(): void {
    this.loading.set(true);
    this.testsManagementService.getAllTests(this.selectedFilters()).subscribe({
      next: (res) => {
        this.tests.set(res.tests);
        this.totalTests.set(res.total_tests);
        this.totalPages.set(res.total_pages);
        this.hasMore.set(res.has_more);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar tests:', err);
        this.errorMessage.set('Error al cargar la lista de tests');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  // Métodos para filtros y ordenación
  onFilterChange(): void {
    this.selectedFilters.update(filters => ({ ...filters, page: 1 }));
    this.loadTests();
  }

  resetFilters(): void {
    this.selectedFilters.set({
      page: 1,
      page_size: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
      main_topic: '',
      sub_topic: '',
      level: '',
      search: ''
    });
    this.loadTests();
  }

  updateFilter<T extends keyof TestsListFilters>(key: T, value: TestsListFilters[T]): void {
    this.selectedFilters.update(filters => ({ ...filters, [key]: value }));
    if (key !== 'page') {
      this.onFilterChange();
    }
  }

  removeFilter(key: keyof TestsListFilters): void {
    const defaultValue = key === 'page_size' ? 10 : '';
    this.updateFilter(key, defaultValue as any);
  }

  // Métodos para ordenamiento
  toggleSortOrder(): void {
    const currentOrder = this.selectedFilters().sort_order || 'desc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    this.updateFilter('sort_order', newOrder);
  }

  setSortBy(sortBy: string): void {
    this.updateFilter('sort_by', sortBy);
  }

  // Métodos para paginación
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    
    this.selectedFilters.update(filters => ({ ...filters, page }));
    this.loadTests();
  }

  previousPage(): void {
    if (this.selectedFilters().page > 1) {
      const newPage = this.selectedFilters().page - 1;
      this.goToPage(newPage);
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      const newPage = this.selectedFilters().page + 1;
      this.goToPage(newPage);
    }
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(this.totalPages(), this.selectedFilters().page);
  }

  getStartIndex(): number {
    return ((this.selectedFilters().page - 1) * (this.selectedFilters().page_size || 10)) + 1;
  }

  getEndIndex(): number {
    return Math.min(this.selectedFilters().page * (this.selectedFilters().page_size || 10), this.totalTests());
  }

  // Métodos para mostrar filtros activos
  showFilterIndicators(): boolean {
    const filters = this.selectedFilters();
    return !!(filters.search || filters.main_topic || filters.level || filters.sub_topic);
  }

  showPagination(): boolean {
    return this.totalTests() > 0 && this.totalPages() > 1;
  }

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDate(dateString);
  }

  // Métodos para eliminar tests
  prepareDeleteTest(test: TestWithCount): void {
    this.testToDelete = { id: test.id || null, title: test.title };
    this.showDeleteModal.set(true);
  }

  confirmDeleteTest(): void {
    if (!this.testToDelete.id) return;
    
    this.deleting.set(true);
    this.testsManagementService.deleteTest(this.testToDelete.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.showSuccessModal.set(true);
        this.loadTests();
      },
      error: (err) => {
        console.error('Error al eliminar test:', err);
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.errorMessage.set(err.error?.message || 'Error al eliminar el test');
        this.showErrorModal.set(true);
      }
    });
  }

  cancelDeleteTest(): void {
    this.showDeleteModal.set(false);
    this.testToDelete = { id: null, title: null };
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }

  // Método para obtener el texto de filtros activos
  getActiveFilterLabel(key: keyof TestsListFilters): string {
    switch (key) {
      case 'search':
        return 'Búsqueda';
      case 'main_topic':
        return 'Tema principal';
      case 'sub_topic':
        return 'Subtema';
      case 'level':
        return 'Nivel';
      default:
        return key;
    }
  }
}
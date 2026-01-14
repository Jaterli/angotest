import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestWithCount } from '../../../shared/models/test.model';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { TestsFilterOptions, TestsListFilters } from '../../models/admin-tests.models';

@Component({
  selector: 'app-admin-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './admin-test-list.component.html',
})
export class AdminTestListComponent implements OnInit {
  private testsManagementService = inject(TestsManagementService);

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
  filters = signal<TestsListFilters>({
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    main_topic: '',
    sub_topic: '',
    level: '',
    is_active: true,
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
    { value: 'is_active', label: 'Activado' },    
  ];

  // Computed properties
  currentSortLabel = computed(() => {
    const sortBy = this.filters().sort_by;
    const option = this.sortOptions.find(o => o.value === sortBy);
    return option ? option.label : 'Fecha de creación';
  });

  currentSortOrderLabel = computed(() => {
    return this.filters().sort_order === 'asc' ? 'Ascendente' : 'Descendente';
  });

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
    this.testsManagementService.getAllTests(this.filters()).subscribe({
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
  applyFilters(): void {
    this.filters.update(f => ({
      ...f,
      page: 1 // Resetear a primera página
    }));
    this.loadTests();
  }

  clearFilters(): void {
    this.filters.set({
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

  onSortChange(sortBy: string): void {
    const currentFilters = this.filters();
    const currentSortOrder = currentFilters.sort_order;
    
    // Si ya está ordenado por este campo, cambiar el orden
    if (currentFilters.sort_by === sortBy) {
      this.filters.update(f => ({
        ...f,
        sort_order: currentSortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      // Ordenar por nuevo campo (desc por defecto)
      this.filters.update(f => ({
        ...f,
        sort_by: sortBy,
        sort_order: 'desc'
      }));
    }
    
    this.applyFilters();
  }

  // Métodos para paginación
  previousPage(): void {
    if (this.filters().page > 1) {
      this.filters.update(f => ({
        ...f,
        page: f.page - 1
      }));
      this.loadTests();
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.filters.update(f => ({
        ...f,
        page: f.page + 1
      }));
      this.loadTests();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.filters.update(f => ({
        ...f,
        page: page
      }));
      this.loadTests();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages();
    
    // Mostrar máximo 5 páginas
    let startPage = Math.max(1, this.filters().page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getStartIndex(): number {
    const filters = this.filters();
    return (filters.page - 1) * filters.page_size + 1;
  }

  getEndIndex(): number {
    const filters = this.filters();
    const end = filters.page * filters.page_size;
    return Math.min(end, this.totalTests());
  }

  // Métodos para la tabla (estilos de nivel)
  getLevelClasses(level: string): string {
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

  // Métodos para eliminar tests (se mantienen igual)
  prepareDeleteTest(test: TestWithCount): void {
    this.testToDelete = { id: test.id || null, title: test.title };
    this.showDeleteModal.set(true);
  }

  confirmDeleteTest(): void {
    if (!this.testToDelete.id) return;
    
    this.deleting.set(true);
    this.testsManagementService.deleteTest(this.testToDelete.id).subscribe({
      next: () => {
        // Recargar la lista
        this.loadTests();
        
        this.showDeleteModal.set(false);
        this.showSuccessModal.set(true);
        this.deleting.set(false);
        this.testToDelete = { id: null, title: null };
      },
      error: (err) => {
        console.error('Error al eliminar test:', err);
        this.errorMessage.set(err.error?.error || 'Error al eliminar el test. Inténtalo de nuevo.');
        this.showErrorModal.set(true);
        this.deleting.set(false);
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
}
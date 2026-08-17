// admin-test-list.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestAvailableFilters, TestFilters, TestsListStats, TestWithCount } from '../../../shared/models/test.models';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal.component';
import { TestsManagementService } from '../../services/tests-management.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { InvitationCreateComponent } from '../../../shared/components/invitation/invitation-create.component';


@Component({
  selector: 'app-admin-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, InvitationCreateComponent],
  templateUrl: './admin-test-list.component.html',
})
export class AdminTestListComponent implements OnInit {
  private testsManagementService = inject(TestsManagementService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Datos
  tests = signal<TestWithCount[]>([]);

  // Paginación (datos devueltos por el backend)
  totalPages = signal(0);
  hasMore = signal(false);

  // Estados
  loading = signal(true);
  loadingOptions = signal(false);
  deleting = signal(false);

  // Modal para la invitación
  showInviteModal = signal(false);
  selectedTestForInvitation: any | null = null;

  // Filtros disponibles
  availableFilters = signal<TestAvailableFilters>({
    main_topics: [],
    sub_topics: [],
    levels: [],
  });


  private readonly defaultFilters: TestFilters = {
    page: 1,
    page_size: 10,
    ordering: 'created_at',
    order_dir: 'desc',
    main_topic: '',
    level: '',
    search: '',
    sub_topic: '',
  };
  selectedFilters = signal<TestFilters>(this.defaultFilters);

  // Estadísticas
  stats = signal<TestsListStats>({
    total_filtered: 0,
    total_unfiltered: 0,
  });

  // Opciones de ordenación (para la UI)
  sortOptions = [
    { value: 'title', label: 'Título' },
    { value: 'main_topic', label: 'Tema principal' },
    { value: 'sub_topic', label: 'Subtema' },
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'updated_at', label: 'Fecha de actualización' },
    { value: 'created_by', label: 'Creador' },
    { value: 'level', label: 'Nivel' },
  ];

  // Estado de la UI
  showFilters = signal(false);

  // Computed properties
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'created_at';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Fecha de creación';
  });

  // Computed: índices de paginación
  startIndex = computed(() => (this.selectedFilters().page - 1) * this.selectedFilters().page_size + 1);
  endIndex = computed(() => Math.min(this.selectedFilters().page * this.selectedFilters().page_size, this.stats().total_filtered));

  // Modal de confirmación
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);

  // Información del test a eliminar
  testToDelete: { id: number | null, title: string | null } = { id: null, title: null };
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadTests();
  }

  // Memoria de filtros (localStorage)
  private readonly FILTER_STORAGE_KEY = 'admin_tests_filters';

  loadSavedFilters(): void {
    try {
      const savedFilters = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        this.selectedFilters.set({ ...this.selectedFilters(), ...filters });
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }

  saveFilters(): void {
    const filters = {
      ...this.selectedFilters(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }

  loadTests(): void {
    this.loading.set(true);
    
    // Construir el filtro para el servicio
    const raw = this.selectedFilters();
    const filter: TestFilters = {
      ...raw,                          // Copia todos los campos
      ordering: raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering,
    };

    this.testsManagementService.getAllTests(filter).subscribe({
      next: (res) => {
        this.tests.set(res.data);
        this.availableFilters.set(res.available_filters);
        this.hasMore.set(res.pagination.has_more);
        this.totalPages.set(res.pagination.total_pages);
        this.stats.set(res.stats);
        this.loading.set(false);
        this.saveFilters();
      },
      error: err => {
        console.error('Error al cargar tests:', err);
        this.errorMessage.set('Error al cargar la lista de tests');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }


  // --- Métodos de filtros ---
  updateFilter<K extends keyof TestFilters>(key: K, value: TestFilters[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    if (key !== 'page') {
      // Al cambiar cualquier filtro que no sea página, resetear a página 1
      this.selectedFilters.update(f => ({ ...f, page: 1 }));
    }
    this.loadTests();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadTests();
  }

  removeFilter(key: keyof TestFilters): void {
    const defaultValue = this.defaultFilters[key] ?? '';
    this.updateFilter(key, defaultValue);
  }

  // --- Ordenamiento ---
  setSortBy(sortBy: string): void {
    this.updateFilter('ordering', sortBy);
  }

  toggleSortOrder(): void {
    const currentDir = this.selectedFilters().order_dir || 'desc';
    this.updateFilter('order_dir', currentDir === 'asc' ? 'desc' : 'asc');
  }
  

  // --- Paginación ---
  setPageSize(size: number): void {
    this.updateFilter('page_size', size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.updateFilter('page', page);
  }

  previousPage(): void {
    if (this.selectedFilters().page > 1) {
      this.goToPage(this.selectedFilters().page - 1);
    }
  }

  nextPage(): void {
    if (this.hasMore()) {
      this.goToPage(this.selectedFilters().page + 1);
    }
  }

  getPageNumbers(): number[] {
    return this.sharedUtilsService.getSharedPageNumbers(
      this.totalPages(),
      this.selectedFilters().page
    );
  }


  // --- Utilidades UI --- 
  showFilterIndicators(): boolean {
    const f = this.selectedFilters();
    return !!(f.search || f.main_topic || f.level || f.sub_topic);
  }

  showPagination(): boolean {
    return this.stats().total_filtered > 0 && this.totalPages() > 1;
  }

  // --- Métodos para la UI ---
  getSortOrderIcon(): string {
    return this.selectedFilters().order_dir === 'asc' ? '↑' : '↓';
  }

  getSortOrderLabel(): string {
    return this.selectedFilters().order_dir === 'asc' ? 'Ascendente' : 'Descendente';
  }


  // --- Métodos auxiliares (delegados a SharedUtilsService) ---

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  formatDateTime(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  // --- Modal de invitación ---

  openInviteModal(testData: any): void {
    this.selectedTestForInvitation = testData;
    this.showInviteModal.set(true);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
    this.selectedTestForInvitation = null;
  }

  // --- Métodos para eliminar tests ---

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
}
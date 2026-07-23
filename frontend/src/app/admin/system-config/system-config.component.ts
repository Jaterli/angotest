import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SystemConfigService } from '../services/system-config.service';
import { SystemConfig, CreateSystemConfigDTO, UpdateSystemConfigDTO, DefaultSystemConfig, SystemConfigFilters } from '../models/system-config.models';
import { ModalComponent } from '../../shared/components/modal.component';


@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './system-config.component.html'
})
export class SystemConfigComponent implements OnInit {
  private systemConfigService = inject(SystemConfigService);

  // ========== DATOS ==========
  configs = signal<SystemConfig[]>([]);

  // ========== ESTADOS ==========
  loading = signal(true);
  loadingDefaults = signal(false);
  deleting = signal(false);       // para el modal de eliminación

  // ========== MODALES ==========
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  showImportModal = signal(false);

  // ========== ELEMENTOS ACTUALES ==========
  currentConfig = signal<SystemConfig | null>(null);
  configToDelete = signal<SystemConfig | null>(null);
  newConfig = signal<CreateSystemConfigDTO>({ key: '', value: '', description: '' });
  editConfig = signal<UpdateSystemConfigDTO>({});

  // ========== FILTROS ==========
  private readonly defaultFilters: SystemConfigFilters = {
    ordering: 'key',
    order_dir: 'asc',
    search: ''
  };
  selectedFilters = signal<SystemConfigFilters>(this.defaultFilters);

  // Opciones de ordenación (para la UI)
  sortOptions = [
    { value: 'key', label: 'Clave' },
    { value: 'value', label: 'Valor' },
    { value: 'updated_at', label: 'Fecha actualización' },
    { value: 'created_at', label: 'Fecha creación' }
  ];

  // ========== ESTADÍSTICAS ==========
  stats = signal({
    total_filtered: 0,
    total_unfiltered: 0
  });

  // ========== UI ==========
  showFilters = signal(false);
  showConfigInfo = signal(false);
  defaultConfigsInfo = signal<DefaultSystemConfig[]>([]);
  errorMessage = signal('');

  // ========== COMPUTED ==========
  currentSortLabel = computed(() => {
    const ordering = this.selectedFilters().ordering || 'key';
    const option = this.sortOptions.find(o => o.value === ordering);
    return option ? option.label : 'Clave';
  });


  missingConfigs = computed(() =>
    this.defaultConfigsInfo().filter(c => !c.exists_in_db)
  );

  // ========== CICLO DE VIDA ==========
  ngOnInit(): void {
    this.loadSavedFilters();
    this.loadConfigs();
    this.loadDefaultConfigs();
  }

  // ========== PERSISTENCIA DE FILTROS ==========
  private readonly FILTER_STORAGE_KEY = 'system_config_filters';

  loadSavedFilters(): void {
    try {
      const saved = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.selectedFilters.set({ ...this.defaultFilters, ...parsed });
      }
    } catch (error) {
      console.error('Error al cargar filtros guardados:', error);
    }
  }

  saveFilters(): void {
    const filters = {
      ...this.selectedFilters(),
      timestamp: new Date().getTime()
    };
    localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(filters));
  }

  // ========== CARGA DE DATOS ==========
  loadConfigs(): void {
    this.loading.set(true);

    // Construir el filtro para el servicio
    const raw = this.selectedFilters();
    const filters: SystemConfigFilters = {
      ...raw,                          // Copia todos los campos
      ordering: raw.order_dir === 'desc' ? `-${raw.ordering}` : raw.ordering,
    };

    this.systemConfigService.getAll(filters).subscribe({
      next: (res) => {
        this.configs.set(res.results);
        this.loading.set(false);
        this.saveFilters();
      },
      error: (error) => {
        this.errorMessage.set('Error al cargar las configuraciones.');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  loadDefaultConfigs(): void {
    this.loadingDefaults.set(true);
    this.systemConfigService.getAllDefault().subscribe({
      next: (defaultConfigs) => {
        this.defaultConfigsInfo.set(defaultConfigs);
        this.loadingDefaults.set(false);
      },
      error: (error) => {
        console.error('Error al cargar configuraciones predeterminadas:', error);
        this.loadingDefaults.set(false);
      }
    });
  }

  // ========== MÉTODOS DE FILTROS ==========
  updateFilter<K extends keyof SystemConfigFilters>(key: K, value: SystemConfigFilters[K]): void {
    this.selectedFilters.update(f => ({ ...f, [key]: value }));
    // Al cambiar cualquier filtro que no sea página, resetear a página 1
    this.selectedFilters.update(f => ({ ...f, page: 1 }));    
    this.loadConfigs();
  }

  resetFilters(): void {
    this.selectedFilters.set({ ...this.defaultFilters });
    this.loadConfigs();
  }

  removeFilter(key: keyof SystemConfigFilters): void {
    const defaultValue = this.defaultFilters[key] ?? '';
    this.updateFilter(key, defaultValue);
  }

  showFilterIndicators(): boolean {
    const f = this.selectedFilters();
    return !!(f.search);
  }

  // ========== ORDENACIÓN ==========
  setSortBy(sortBy: string): void {
    this.updateFilter('ordering', sortBy);
  }

  toggleSortOrder(): void {
    const currentDir = this.selectedFilters().order_dir || 'asc';
    this.updateFilter('order_dir', currentDir === 'asc' ? 'desc' : 'asc');
  }

  getSortOrderIcon(): string {
    return this.selectedFilters().order_dir === 'asc' ? '↑' : '↓';
  }

  // ========== CRUD ==========
  openCreateModal(): void {
    this.newConfig.set({ key: '', value: '', description: '' });
    this.showCreateModal.set(true);
  }

  openEditModal(config: SystemConfig): void {
    this.currentConfig.set(config);
    this.editConfig.set({
      key: config.key,
      value: config.value,
      description: config.description
    });
    this.showEditModal.set(true);
  }

  openDeleteModal(config: SystemConfig): void {
    this.configToDelete.set(config);
    this.showDeleteModal.set(true);
  }

  createConfig(): void {
    const config = this.newConfig();
    if (!config.key || !config.value) {
      this.errorMessage.set('La clave y el valor son obligatorios');
      this.showErrorModal.set(true);
      return;
    }

    this.systemConfigService.create(config).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadConfigs();
        this.showSuccessModal.set(true);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Error al crear la configuración');
        this.showErrorModal.set(true);
      }
    });
  }

  updateConfig(): void {
    const config = this.currentConfig();
    if (!config) return;

    this.systemConfigService.update(config.id, this.editConfig()).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.loadConfigs();
        this.showSuccessModal.set(true);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.error || 'Error al actualizar la configuración');
        this.showErrorModal.set(true);
      }
    });
  }

  deleteConfig(): void {
    const config = this.configToDelete();
    if (!config) return;

    this.deleting.set(true);
    this.systemConfigService.delete(config.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.loadConfigs();
        this.showSuccessModal.set(true);
      },
      error: (error) => {
        this.deleting.set(false);
        this.showDeleteModal.set(false);
        this.errorMessage.set(error.error?.error || 'Error al eliminar la configuración');
        this.showErrorModal.set(true);
      }
    });
  }

  resetForm(): void {
    this.newConfig.set({ key: '', value: '', description: '' });
    this.editConfig.set({});
  }

  // ========== UTILIDADES PARA LA UI ==========
  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }
}
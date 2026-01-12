// dashboard.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { SharedUtilsService } from '../../shared/services/shared-utils.service';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStats, SimpleDashboardStats } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sharedUtilsService = inject(SharedUtilsService);

  // Datos
  fullStats = signal<DashboardStats | null>(null);
  simpleStats = signal<SimpleDashboardStats | null>(null);
  
  // Estados
  loadingFullStats = signal(true);
  loadingSimpleStats = signal(true);
  activeTab = signal<'overview' | 'tests' | 'users'>('overview');
  
  // Filtros
  minTests = signal(3);
  minTestsOptions = [1, 3, 5, 10, 15];
  
  // Error handling
  errorMessage = signal('');
  showErrorModal = signal(false);

  ngOnInit() {
    this.loadSimpleDashboard();
    this.loadFullDashboard();
  }

  // Cargar dashboard simple
  loadSimpleDashboard(): void {
    this.loadingSimpleStats.set(true);
    
    this.dashboardService.getSimpleDashboard().subscribe({
      next: (stats) => {
        this.simpleStats.set(stats);
        this.loadingSimpleStats.set(false);
      },
      error: (err) => {
        console.error('Error al cargar dashboard simple:', err);
        this.errorMessage.set('Error al cargar estadísticas simples');
        this.showErrorModal.set(true);
        this.loadingSimpleStats.set(false);
      }
    });
  }

  // Cargar dashboard completo
  loadFullDashboard(): void {
    this.loadingFullStats.set(true);
    
    const filters = { min_tests: this.minTests() };
    
    this.dashboardService.getDashboardStats(filters).subscribe({
      next: (stats) => {
        this.fullStats.set(stats);
        this.loadingFullStats.set(false);
      },
      error: (err) => {
        console.error('Error al cargar dashboard completo:', err);
        this.errorMessage.set('Error al cargar estadísticas completas');
        this.showErrorModal.set(true);
        this.loadingFullStats.set(false);
      }
    });
  }

  // Método para actualizar el filtro
  updateMinTests(value: number): void {
    this.minTests.set(value);
    this.applyFilters();
  }

  // Cambiar tab
  setActiveTab(tab: 'overview' | 'tests' | 'users'): void {
    this.activeTab.set(tab);
  }

  // Aplicar filtros
  applyFilters(): void {
    this.loadFullDashboard();
  }

  // Reiniciar filtros
  resetFilters(): void {
    this.minTests.set(3);
    this.applyFilters();
  }

  // Helper methods
  formatNumber(num: number): string {
    return num.toString();
    //return this.sharedUtilsService.formatNumber(num);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatTime(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  // Cerrar modal de error
  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }
}
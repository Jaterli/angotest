import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from '../../../core/services/test.service';
import { Test } from '../../../models/test.model';
import { RouterModule } from '@angular/router';
import { ModalComponent } from '../../../components/modal.component';


@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './admin-test-list.component.html',
})
export class AdminTestListComponent implements OnInit {

  tests: Test[] = [];
  loading = signal(true);
  deleting = signal(false);
  
  // Estados para los modales
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  
  // Información del test a eliminar
  testToDelete: { id: number | null, title: string | null } = { id: null, title: null };
  errorMessage = signal('');

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.loading.set(true);
    this.testService.getAllTests().subscribe({
      next: (res: any) => {
        this.tests = res.tests;
        this.loading.set(false);
      },
      error: err => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  // Preparar eliminación de test
  prepareDeleteTest(test: Test): void {
    this.testToDelete = { id: test.id || null, title: test.title };
    this.showDeleteModal.set(true);
  }

  // Confirmar eliminación
  confirmDeleteTest(): void {
    if (!this.testToDelete.id) return;
    
    this.deleting.set(true);
    this.testService.deleteTest(this.testToDelete.id).subscribe({
      next: () => {
        // Eliminar test de la lista localmente
        this.tests = this.tests.filter(test => test.id !== this.testToDelete.id);
        
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

  // Cancelar eliminación
  cancelDeleteTest(): void {
    this.showDeleteModal.set(false);
    this.testToDelete = { id: null, title: null };
  }

  // Cerrar modal de éxito
  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
  }

  // Cerrar modal de error
  closeErrorModal(): void {
    this.showErrorModal.set(false);
  }
}
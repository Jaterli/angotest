import { Component, signal, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/components/modal.component';
import { UsersManagementService } from '../services/users-management.service';

@Component({
  standalone: true,
  selector: 'app-user-details',
  imports: [
    CommonModule,
    DatePipe,
    ModalComponent
  ],
  templateUrl: './user-profile.component.html',
})
export class UserDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersManagementService = inject(UsersManagementService);

  loading = signal(true);
  user = signal<any | null>(null);
  
  // Estados para los modales
  showDeleteModal = signal(false);
  showSuccessModal = signal(false);
  showErrorModal = signal(false);
  errorMessage = signal('');
  isDeleting = signal(false);

  displayedColumns: string[] = ['test', 'correct_answers', 'time_taken', 'created_at', 'actions'];

  constructor() {
    effect(() => {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.fetchUser(id);
    });
  }

  fetchUser(id: number) {
    this.loading.set(true);
    this.usersManagementService.getUserDetails(id).subscribe({
      next: (res: any) => {
        this.user.set(res.user);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getAverageScore(): number {
    if (!this.user() || !this.user().results || this.user().results.length === 0) {
      return 0;
    }
    
    const totalScore = this.user().results.reduce((sum: number, result: any) => {
      return sum + (result.correct_answers / result.total * 100);
    }, 0);
    
    return totalScore / this.user().results.length;
  }

  getTotalTime(): number {
    if (!this.user() || !this.user().results || this.user().results.length === 0) {
      return 0;
    }
    
    const totalSeconds = this.user().results.reduce((sum: number, result: any) => {
      return sum + result.time_taken;
    }, 0);
    
    return totalSeconds / 60;
  }

  // Método para iniciar el proceso de eliminación
  initiateDelete() {
    this.showDeleteModal.set(true);
  }

  // Método para confirmar eliminación
  confirmDelete() {
    this.isDeleting.set(true);
    const userId = this.user()?.id;
    
    this.usersManagementService.deleteUser(userId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.showSuccessModal.set(true);
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/admin/users/stats']);
        }, 5000);
      },
      error: (error: any) => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.errorMessage.set(
          error.error?.message || 'Error al eliminar el usuario. Por favor, inténtelo de nuevo.'
        );
        this.showErrorModal.set(true);
      }
    });
  }

  // Método para cancelar eliminación
  cancelDelete() {
    this.showDeleteModal.set(false);
  }

  // Métodos para cerrar modales
  closeSuccessModal() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/admin/users']);
  }

  closeErrorModal() {
    this.showErrorModal.set(false);
  }

  viewResultDetails(result: any) {
    console.log('Ver detalles del resultado:', result);
    // Implementar lógica según necesites
  }


  getDeleteMessage(): string {
    const user = this.user();
    if (!user) return '';
    
    const testsCount = user.tests?.length || 0;
    const resultsCount = user.results?.length || 0;
    
    return `¿Estás seguro de que quieres eliminar al usuario "${user.username}"? ` +
          `Esta acción eliminará ${testsCount} test${testsCount !== 1 ? 's' : ''} creados ` +
          `y ${resultsCount} resultado${resultsCount !== 1 ? 's' : ''} de tests. ` +
          `Esta acción no se puede deshacer.`;
  }

}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { TestWithStatus, TestsWithStatusResponse } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './tests-list.component.html',
})
export class TestsListComponent implements OnInit {
  // Tests separados por estado
  notStartedTests: TestWithStatus[] = [];
  inProgressTests: TestWithStatus[] = [];
  completedTests: TestWithStatus[] = [];
  loading = signal(true);
  currentUser: User | null = null;

  // Estadísticas
  totalTests = signal(0);
  completedCount = signal(0);
  inProgressCount = signal(0);
  notStartedCount = signal(0);

  // Información para el modal de confirmación
  showRetakeModal = signal(false);
  testToRetake: { id: number | null, title: string | null } = { id: null, title: null };

  constructor(
    private testService: TestService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTestsWithStatus();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.getUser();
    if (currentUser) {
      this.currentUser = currentUser;
    } else {
      console.error('No se pudo cargar el usuario actual.');
      // Redirigir a login si no hay usuario
      // this.router.navigate(['/login']);
    }
  }

  // Cargar todos los tests con estado
  loadTestsWithStatus(): void {
    this.loading.set(true);
    this.testService.getAllTestsWithStatus().subscribe({
      next: (res: TestsWithStatusResponse) => {
        this.processTestsResponse(res);
        this.loading.set(false);
        console.log('Tests cargados con estado:', res);
      },
      error: err => {
        console.error('Error al cargar tests con estado:', err);
        this.loading.set(false);
      }
    });
  }

  // Procesar respuesta de tests con estado
  private processTestsResponse(res: TestsWithStatusResponse): void {
    // Separar tests en tres categorías según el nuevo campo 'status'
    this.notStartedTests = res.tests.filter(test => test.status === 'not_started');
    this.inProgressTests = res.tests.filter(test => test.status === 'in_progress');
    this.completedTests = res.tests.filter(test => test.status === 'completed');
    
    // Actualizar estadísticas
    this.totalTests.set(res.total_tests);
    this.completedCount.set(res.completed_count);
    this.inProgressCount.set(res.in_progress_count);
    this.notStartedCount.set(res.not_started_count);
  }


  // Calcular preguntas pendientes para tests en progreso
  getRemainingQuestions(test: TestWithStatus): number {
    if (!test.total_questions) return 0;
    
    // Si tenemos progreso como porcentaje
    if (test.progress !== undefined) {
      const answered = Math.round((test.progress / 100) * test.total_questions);
      return Math.max(0, test.total_questions - answered);
    }
    
    // Calcular basado en respuestas
    const answered = (test.correct_answers || 0) + (test.wrong_answers || 0);
    return Math.max(0, (test.total_questions || 0) - answered);
  }

  // Determinar si mostrar información de respuestas
  hasAnsweredQuestions(test: TestWithStatus): boolean {
    return (test.correct_answers || 0) + (test.wrong_answers || 0) > 0;
  }

  // Formatear tiempo de manera más legible
  formatTimeTaken(seconds: number): string {
    if (!seconds || seconds === 0) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  // Determinar el color del badge según el progreso
  getProgressBadgeClass(progress: number): string {
    if (progress >= 75) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    } else if (progress >= 50) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    } else if (progress >= 25) {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }
  }

  // Determinar el color del badge según el nivel
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

  // Determinar el color del badge según la puntuación
  getScoreBadgeClass(score: number): string {
    if (score >= 80) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    } else if (score >= 60) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }
  }

  // Determinar el color del badge según el estado
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'in_progress':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'not_started':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  }

  // Calcular el porcentaje de progreso general
  getProgressPercentage(): number {
    if (this.totalTests() === 0) return 0;
    return Math.round((this.completedCount() / this.totalTests()) * 100);
  }

  // Preparar para retomar un test
  prepareRetakeTest(test: TestWithStatus): void {
    this.testToRetake = { id: test.id || null, title: test.title };
    this.showRetakeModal.set(true);
  }

  // Confirmar retomar test
  confirmRetakeTest(): void {
    if (this.testToRetake.id) {
      this.router.navigate([`/tests/${this.testToRetake.id}/start-single`]);
    }
    this.showRetakeModal.set(false);
  }

  // Cancelar retomar test
  cancelRetakeTest(): void {
    this.showRetakeModal.set(false);
    this.testToRetake = { id: null, title: null };
  }

  // Reiniciar test en progreso
  restartInProgressTest(testId: number): void {
    this.testService.deleteTestProgress(testId).subscribe({
      next: () => {
        console.log('Progreso eliminado, recargando lista...');
        this.loadTestsWithStatus();
      },
      error: (err) => {
        console.error('Error al reiniciar test:', err);
      }
    });
  }

  // Obtener texto descriptivo del estado
  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En progreso';
      case 'not_started': return 'Por hacer';
      default: return status;
    }
  }

  // Método para obtener el ícono SVG según el estado
  getStatusIcon(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z';
      case 'completed':
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z';
      case 'not_started':
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z';
      default:
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z';
    }
  }

  
  //   // Método para obtener el color del ícono según el estado
  // getStatusIconColor(status: string): string {
  //   switch (status) {
  //     case 'in_progress':
  //       return 'text-amber-600 dark:text-amber-400';
  //     case 'completed':
  //       return 'text-emerald-600 dark:text-emerald-400';
  //     case 'not_started':
  //     default:
  //       return 'text-gray-400 dark:text-gray-500';
  //   }
  // }

  // Actualizar el método getInProgressTestProgress
  getInProgressTestProgress(test: TestWithStatus): number {
    // Primero verificar si ya tenemos progress calculado
    if (test.progress !== undefined && test.progress !== null) {
      return Math.round(test.progress);
    }
    
    // Calcular basado en respuestas
    const answered = (test.correct_answers || 0) + (test.wrong_answers || 0);
    const total = test.total_questions || test.questions?.length || 0;
    
    if (total === 0) return 0;
    return Math.round((answered / total) * 100);
  }
}
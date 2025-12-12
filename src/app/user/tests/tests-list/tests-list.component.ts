import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test, TestWithStatus, TestsWithStatusResponse } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './tests-list.component.html',
})
export class TestsListComponent implements OnInit {
  // Tests separados por estado
  notCompletedTests: TestWithStatus[] = [];
  completedTests: TestWithStatus[] = [];
  loading = signal(true);
  currentUser: User | null = null;

  // Estadísticas
  totalTests = signal(0);
  completedCount = signal(0);
  notCompletedCount = signal(0);

  // Información para el modal de confirmación
  showRetakeModal = signal(false);
  testToRetake: { id: number | null, title: string | null } = { id: null, title: null };

  // Exponer Math para usar en la plantilla
  readonly Math = Math;

  constructor(
    private testService: TestService,
    private authService: AuthService
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
        // Fallback: intentar cargar tests normales
        //this.loadAllTestsFallback();
      }
    });
  }

  // Procesar respuesta de tests con estado
  private processTestsResponse(res: TestsWithStatusResponse): void {
    // Separar tests por estado
    this.notCompletedTests = res.tests.filter(test => !test.is_completed);
    this.completedTests = res.tests.filter(test => test.is_completed);
    
    // Actualizar estadísticas
    this.totalTests.set(res.total_tests);
    this.completedCount.set(res.completed_count);
    this.notCompletedCount.set(res.not_completed_count);
  }

  // Fallback si el endpoint nuevo no funciona
  // private loadAllTestsFallback(): void {
  //   this.testService.getAllTests().subscribe({
  //     next: (response: any) => {
  //       // Manejar diferentes formatos de respuesta
  //       let testsArray: any[] = [];
        
  //       if (Array.isArray(response)) {
  //         testsArray = response;
  //       } else if (response && Array.isArray(response.tests)) {
  //         testsArray = response.tests;
  //       } else if (response && typeof response === 'object') {
  //         // Intentar extraer array de cualquier propiedad
  //         const arrayProps = Object.values(response).filter(val => Array.isArray(val));
  //         if (arrayProps.length > 0) {
  //           testsArray = arrayProps[0] as any[];
  //         }
  //       }
        
  //       if (testsArray.length === 0) {
  //         console.warn('No se encontraron tests en la respuesta');
  //         this.resetTestLists();
  //         this.loading.set(false);
  //         return;
  //       }
        
  //       // Convertir a TestWithStatus
  //       const testsWithStatus: TestWithStatus[] = testsArray.map((test: any) => {
  //         // Intentar determinar si está completado basado en resultados
  //         const isCompleted = test.results && 
  //           Array.isArray(test.results) && 
  //           test.results.length > 0 &&
  //           this.currentUser &&
  //           test.results.some((result: any) => result.user_id === this.currentUser?.id);
          
  //         let lastScore: number | undefined;
  //         let completedAt: string | undefined;
          
  //         if (isCompleted && test.results && Array.isArray(test.results) && test.results.length > 0) {
  //           // Encontrar el resultado más reciente del usuario actual
  //           const userResults = test.results
  //             .filter((result: any) => result.user_id === this.currentUser?.id)
  //             .sort((a: any, b: any) => 
  //               new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  //             );
            
  //           if (userResults.length > 0) {
  //             const latestResult = userResults[0];
  //             completedAt = latestResult.created_at;
  //             if (latestResult.total > 0) {
  //               lastScore = Math.round((latestResult.correct_answers / latestResult.total) * 100);
  //             }
  //           }
  //         }
          
  //         return {
  //           id: test.id,
  //           title: test.title || 'Sin título',
  //           description: test.description,
  //           category: test.category || 'General',
  //           level: test.level || 'Principiante',
  //           test_date: test.test_date || new Date().toISOString().split('T')[0],
  //           questions: test.questions || [],
  //           results: test.results || [],
  //           is_completed: isCompleted,
  //           last_score: lastScore,
  //           completed_at: completedAt
  //         } as TestWithStatus;
  //       });
        
  //       // Separar tests por estado
  //       this.notCompletedTests = testsWithStatus.filter(test => !test.is_completed);
  //       this.completedTests = testsWithStatus.filter(test => test.is_completed);
        
  //       // Actualizar estadísticas
  //       this.totalTests.set(testsWithStatus.length);
  //       this.completedCount.set(this.completedTests.length);
  //       this.notCompletedCount.set(this.notCompletedTests.length);
        
  //       this.loading.set(false);
  //       console.log('Tests cargados en fallback:', testsWithStatus);
  //     },
  //     error: (err: any) => {
  //       console.error('Error en fallback:', err);
  //       this.resetTestLists();
  //       this.loading.set(false);
  //     }
  //   });
  // }

  // Reiniciar listas de tests
  private resetTestLists(): void {
    this.notCompletedTests = [];
    this.completedTests = [];
    this.totalTests.set(0);
    this.completedCount.set(0);
    this.notCompletedCount.set(0);
  }

  // Calcular puntuación porcentual
  calculateScore(result: any): number {
    if (!result || !result.total || result.total === 0) return 0;
    return Math.round((result.correct_answers / result.total) * 100);
  }

  // Obtener el último resultado para un test completado
  getLastResultForTest(test: TestWithStatus): any {
    if (!test.results || !Array.isArray(test.results) || test.results.length === 0) return null;
    
    // Filtrar resultados del usuario actual si existe
    let relevantResults = test.results;
    if (this.currentUser) {
      relevantResults = test.results.filter((result: any) => 
        result.user_id === this.currentUser?.id
      );
    }
    
    if (relevantResults.length === 0) return null;
    
    // Ordenar resultados por fecha (más reciente primero)
    const sortedResults = [...relevantResults].sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return sortedResults[0];
  }

  // Preparar para retomar un test
  prepareRetakeTest(test: TestWithStatus): void {
    this.testToRetake = { id: test.id || null, title: test.title };
    this.showRetakeModal.set(true);
  }

  // Confirmar retomar test
  confirmRetakeTest(): void {
    this.showRetakeModal.set(false);
    // La navegación se manejará en el template
  }

  // Cancelar retomar test
  cancelRetakeTest(): void {
    this.showRetakeModal.set(false);
    this.testToRetake = { id: null, title: null };
  }

  // Determinar el color del badge según el nivel
  getLevelBadgeClass(level: string): string {
    if (!level) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    
    switch (level.toLowerCase()) {
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

  // Determinar el color del badge según si está completado o no
  getStatusBadgeClass(isCompleted: boolean): string {
    return isCompleted 
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
  }

  // Calcular el porcentaje de progreso general
  getProgressPercentage(): number {
    if (this.totalTests() === 0) return 0;
    return Math.round((this.completedCount() / this.totalTests()) * 100);
  }
}
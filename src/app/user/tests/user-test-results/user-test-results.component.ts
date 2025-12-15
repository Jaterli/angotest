import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Result } from '../../../models/test.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-test-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-test-results.component.html'
})
export class UserTestResultsComponent implements OnInit {
  results: Result[] = [];
  loading = signal(true);
  currentUser: User | null = null;
  
  // Estados para modales (opcional - para futuras funcionalidades)
  showDetailsModal = signal(false);
  selectedResult: Result | null = null;
  
  // Estadísticas calculadas
  totalAttempts = signal(0);
  averageScore = signal(0);
  totalCorrectAnswers = signal(0);
  totalQuestions = signal(0);
  uniqueTestsCount = signal(0);
  totalTimeTaken = signal(0);

  // Datos para el gráfico (opcional)
  scoreDistribution = signal<number[]>([0, 0, 0]); // [<60%, 60-79%, >=80%]

  // Variables para ordenamiento
  sortBy = signal<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');
  sortedResults = computed(() => {
    const results = [...this.results];
    switch (this.sortBy()) {
      case 'date_desc':
        return results.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'date_asc':
        return results.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case 'score_desc':
        return results.sort((a, b) => {
          const scoreA = a.total_questions > 0 ? (a.correct_answers / a.total_questions) * 100 : 0;
          const scoreB = b.total_questions > 0 ? (b.correct_answers / b.total_questions) * 100 : 0;
          return scoreB - scoreA;
        });
      case 'score_asc':
        return results.sort((a, b) => {
          const scoreA = a.total_questions > 0 ? (a.correct_answers / a.total_questions) * 100 : 0;
          const scoreB = b.total_questions > 0 ? (b.correct_answers / b.total_questions) * 100 : 0;
          return scoreA - scoreB;
        });
      default:
        return results;
    }
  });

  constructor(
    private testService: TestService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadResults();
  }

  loadResults(): void {
    this.loading.set(true);
    // Usamos el nuevo endpoint para resultados completados
    this.testService.getCompletedTests().subscribe({
      next: (res: any) => {
        // El nuevo endpoint devuelve un array de Results directamente
        // o dentro de una propiedad "completed_tests"
        if (res.completed_tests && Array.isArray(res.completed_tests)) {
          this.results = res.completed_tests;
        } else if (Array.isArray(res)) {
          this.results = res;
        } else if (res.results && Array.isArray(res.results)) {
          this.results = res.results; // Mantener compatibilidad con formato antiguo
        } else {
          this.results = [];
        }
        
        this.calculateStatistics();
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar resultados:', err);
      }
    });
  }


  calculateStatistics(): void {
    this.totalAttempts.set(this.results.length);
    
    // Calcular estadísticas
    const totalCorrect = this.results.reduce((sum, result) => sum + result.correct_answers, 0);
    const totalQuestions = this.results.reduce((sum, result) => sum + result.total_questions, 0);
    const totalTime = this.results.reduce((sum, result) => sum + result.time_taken, 0);
    
    this.totalCorrectAnswers.set(totalCorrect);
    this.totalQuestions.set(totalQuestions);
    this.totalTimeTaken.set(totalTime);
    
    if (totalQuestions > 0) {
      this.averageScore.set(Math.round((totalCorrect / totalQuestions) * 100));
    }
    
    // Calcular tests únicos
    const uniqueTestIds = new Set(this.results.map(result => result.test_id));
    this.uniqueTestsCount.set(uniqueTestIds.size);
    
    // Calcular distribución de puntuaciones
    let lowScores = 0;
    let mediumScores = 0;
    let highScores = 0;
    
    this.results.forEach(result => {
      if (result.score_percent >= 80) {
        highScores++;
      } else if (result.score_percent >= 60) {
        mediumScores++;
      } else {
        lowScores++;
      }
    });
    
    this.scoreDistribution.set([lowScores, mediumScores, highScores]);
  }

  // Método para ver detalles (opcional - para futuras funcionalidades)
  viewResultDetails(result: Result): void {
    this.selectedResult = result;
    this.showDetailsModal.set(true);
  }

  // Cerrar modal de detalles
  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedResult = null;
  }
  
  onSortChange(event: any): void {
    this.sortBy.set(event.target.value);
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

  // Formatear tiempo de manera más legible
  formatTimeTaken(seconds: number): string {
    if (!seconds || seconds === 0) return '0s';
    
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

  // Obtener tiempo por pregunta
  getTimePerQuestion(timeTaken: number, totalQuestions: number): string {
    if (!timeTaken || !totalQuestions || totalQuestions === 0) return '0s';
    const timePerQuestion = timeTaken / totalQuestions;
    return timePerQuestion < 1 ? 
      `${(timePerQuestion * 1000).toFixed(0)}ms` : 
      `${timePerQuestion.toFixed(1)}s`;
  }

  // Refrescar resultados
  refreshResults(): void {
    this.loadResults();
  }
}
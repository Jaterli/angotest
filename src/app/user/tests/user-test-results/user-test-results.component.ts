import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Result, ResultResponse } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';

@Component({
  selector: 'app-user-test-results',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './user-test-results.component.html'
})
export class UserTestResultsComponent implements OnInit {
  results: Result[] = [];
  loading = signal(true);
  
  // Estados para modales (opcional - para futuras funcionalidades)
  showDetailsModal = signal(false);
  selectedResult: Result | null = null;
  
  // Estadísticas calculadas
  totalTests = signal(0);
  averageScore = signal(0);
  totalCorrectAnswers = signal(0);
  totalQuestions = signal(0);
  
  // Datos para el gráfico (opcional)
  scoreDistribution = signal<number[]>([0, 0, 0]); // [<60%, 60-79%, >=80%]

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.loadResults();
  }

  loadResults(): void {
    this.loading.set(true);
    this.testService.getUserTestResults().subscribe({
      next: (res: ResultResponse) => {
        this.results = res.results || [];
        this.calculateStatistics();
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar resultados:', err);
        this.loading.set(false);
      }
    });
  }

  calculateStatistics(): void {
    this.totalTests.set(this.results.length);
    
    const totalCorrect = this.results.reduce((sum, result) => sum + result.correct_answers, 0);
    const totalQuestions = this.results.reduce((sum, result) => sum + result.total, 0);
    
    this.totalCorrectAnswers.set(totalCorrect);
    this.totalQuestions.set(totalQuestions);
    
    if (totalQuestions > 0) {
      this.averageScore.set(Math.round((totalCorrect / totalQuestions) * 100));
    }
    
    // Calcular distribución de puntuaciones
    let lowScores = 0;
    let mediumScores = 0;
    let highScores = 0;
    
    this.results.forEach(result => {
      if (result.total > 0) {
        const percentage = (result.correct_answers / result.total) * 100;
        if (percentage >= 80) {
          highScores++;
        } else if (percentage >= 60) {
          mediumScores++;
        } else {
          lowScores++;
        }
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
  
  // Método auxiliar para obtener la clase de color según puntuación
  getScoreColorClass(percentage: number): string {
    if (percentage >= 80) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
    } else if (percentage >= 60) {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    }
  }
}
import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test, AnswerSubmit, ResumeTestResponse, SaveResultInput } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-test-progress',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './test-resolve.component.html' // Reutiliza el template existente
})
export class TestResolveComponent implements OnInit, OnDestroy {
  test?: Test;
  selectedAnswers: Record<number, number> = {};
  loading = signal(true);
  startTime = 0;
  timeElapsed = 0;
  isResuming = false;
  resultId?: number;
  
  // Señales para los modales
  showConfirmSubmitModal = signal(false);
  showIncompleteModal = signal(false);
  showErrorModal = signal(false);
  showSuccessModal = signal(false);
  
  // Datos para los modales
  errorMessage = signal<string>('');
  timeTaken = signal<number>(0);
  score = signal<number>(0);
  
  private autoSaveInterval = 30000; // 30 segundos
  private autoSaveSubscription?: Subscription;

  constructor(
    private testService: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const testId = +params['id'];
      this.loadTest(testId);
    });
  }

  ngOnDestroy(): void {
    // Guardar progreso al salir si está en progreso
    if (this.isResuming && this.getAnsweredCount() > 0) {
      this.saveProgress('in_progress');
    }
    
    // Limpiar suscripciones
    this.autoSaveSubscription?.unsubscribe();
  }

  loadTest(testId: number): void {
    this.loading.set(true);
    
    this.testService.getTestProgress(testId).subscribe({
      next: (res: ResumeTestResponse) => {
        console.log('Test cargado:', res);
        this.test = res.test;
        this.isResuming = res.is_resuming;
        this.resultId = res.result_id;
        
        // Cargar respuestas guardadas si hay
        if (res.is_resuming && res.answers && res.answers.length > 0) {
          this.loadSavedAnswers(res.answers);
          this.timeElapsed = res.time_elapsed || 0;
        }
        
        // Iniciar tiempo
        this.startTime = Date.now() - (this.timeElapsed * 1000);
        
        // Iniciar auto-guardado
        this.startAutoSave();
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Error al cargar el test. Por favor, intenta de nuevo.');
        this.showErrorModal.set(true);
        this.loading.set(false);
      }
    });
  }

  loadSavedAnswers(savedAnswers: AnswerSubmit[]): void {
    savedAnswers.forEach(answer => {
      this.selectedAnswers[answer.question_id] = answer.answer_id;
    });
  }

  private startAutoSave(): void {
    this.autoSaveSubscription = interval(this.autoSaveInterval).subscribe(() => {
      this.saveProgress('in_progress');
    });
  }

  saveProgress(status: 'in_progress' | 'completed' = 'in_progress'): void {
    if (!this.test) return;

    const answers: AnswerSubmit[] = Object.entries(this.selectedAnswers).map(([qid, aid]) => ({
      question_id: +qid,
      answer_id: +aid
    }));

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    
    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: answers,
      time_taken: timeSpent,
      status: status
    };

    this.testService.saveOrUpdateResult(saveData).subscribe({
      next: (response) => {
        console.log('Progreso guardado:', response);
        if (response.result && response.result.id) {
          this.resultId = response.result.id;
        }
      },
      error: (err) => {
        console.error('Error al guardar progreso:', err);
      }
    });
  }

  // Métodos del template
  isQuestionAnswered(questionId: number): boolean {
    return this.selectedAnswers[questionId] !== undefined;
  }

  getAnsweredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  selectAnswer(questionId: number, answerId: number) {
    this.selectedAnswers[questionId] = answerId;
    // Guardar inmediatamente
    this.saveProgress('in_progress');
  }

  showSubmitConfirmation(): void {
    if (this.getAnsweredCount() !== this.test?.questions.length) {
      this.showIncompleteModal.set(true);
      return;
    }
    
    this.showConfirmSubmitModal.set(true);
  }

  submitTest(): void {
    if (!this.test) return;

    // Guardar como completado
    const answers: AnswerSubmit[] = Object.entries(this.selectedAnswers).map(([qid, aid]) => ({
      question_id: +qid,
      answer_id: +aid
    }));

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeTaken.set(timeSpent);

    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: answers,
      time_taken: timeSpent,
      status: 'completed'
    };

    this.testService.saveOrUpdateResult(saveData).subscribe({
      next: (response: any) => {
        console.log('Test completado:', response);
        
        if (response.result) {
          const correct = response.result.correct_answers || 0;
          const total = response.result.total || this.test?.questions.length;
          this.score.set(total > 0 ? Math.round((correct / total) * 100) : 0);
        }
        
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al completar test:', err);
        this.errorMessage.set(err.error?.message || 'Error al completar el test. Por favor, intenta de nuevo.');
        this.showErrorModal.set(true);
      }
    });
    
    this.showConfirmSubmitModal.set(false);
  }

  getTimeElapsed(): string {
    if (!this.startTime) return '0:00';
    
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  goToTests(): void {
    this.router.navigate(['/tests/in-progress']);
  }

  restartTest(): void {
    if (!this.test) return;
    
    // Eliminar progreso guardado
    this.testService.deleteTestProgress(this.test.id!).subscribe({
      next: () => {
        // Reiniciar variables
        this.selectedAnswers = {};
        this.isResuming = false;
        this.resultId = undefined;
        this.startTime = Date.now();
        this.timeElapsed = 0;
      },
      error: (err) => {
        console.error('Error al reiniciar test:', err);
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.test) return 0;
    return (this.getAnsweredCount() / this.test.questions.length) * 100;
  }

  getUnTotalQuestions(): number {
    if (!this.test) return 0;
    return this.test.questions.length - this.getAnsweredCount();
  }

  // Métodos para manejar modales
  onConfirmSubmit(): void {
    this.submitTest();
  }

  onCancelSubmit(): void {
    this.showConfirmSubmitModal.set(false);
  }

  onSuccessModalConfirm(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/tests/results']);
  }

  onErrorModalConfirm(): void {
    this.showErrorModal.set(false);
  }

  onIncompleteModalConfirm(): void {
    this.showIncompleteModal.set(false);
  }
}
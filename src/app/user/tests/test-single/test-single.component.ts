import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test, AnswerSubmit, ResumeTestResponse, SaveResultInput } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-test-single',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './test-single.component.html'
})
export class TestSingleComponent implements OnInit, OnDestroy {
  private testService = inject(TestService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  test?: Test;
  currentQuestionIndex = 0;
  selectedAnswers: Record<number, number> = {};
  loading = signal(true);
  startTime = 0;
  timeElapsed = 0;
  isResuming = false;
  resultId?: number;
  
  // Señales para modales
  showConfirmSubmitModal = signal(false);
  showErrorModal = signal(false);
  showSuccessModal = signal(false);
  
  // Datos para modales
  errorMessage = signal<string>('');
  timeTaken = signal<number>(0);
  score = signal<number>(0);
  
  // Prevención de copia
  isContentProtected = signal(true);
  
  private autoSaveInterval = 30000; // 30 segundos
  private autoSaveSubscription?: Subscription;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const testId = +params['id'];
      this.loadTest(testId);
    });

    // Prevenir acciones de copia
    this.setupCopyProtection();
  }

  ngOnDestroy(): void {
    // Guardar progreso al salir si está en progreso
    if (this.isResuming && this.getAnsweredCount() > 0) {
      this.saveProgress('in_progress');
    }
    
    // Limpiar suscripciones
    this.autoSaveSubscription?.unsubscribe();
  }

  setupCopyProtection(): void {
    // Prevenir selección de texto
    document.addEventListener('selectstart', this.preventSelection.bind(this));
    
    // Prevenir menú contextual
    document.addEventListener('contextmenu', this.preventContextMenu.bind(this));
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
        
        // Posicionarse en la primera pregunta sin responder
        this.currentQuestionIndex = this.getFirstUnansweredQuestionIndex();
        
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

  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Obtener el índice de la primera pregunta sin responder
  getFirstUnansweredQuestionIndex(): number {
    if (!this.test) return 0;
    
    for (let i = 0; i < this.test.questions.length; i++) {
      const question = this.test.questions[i];
      if (!this.isQuestionAnswered(question.id!)) {
        return i;
      }
    }
    
    // Todas respondidas, mostrar la última
    return this.test.questions.length - 1;
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

  getCurrentQuestion() {
    return this.test?.questions[this.currentQuestionIndex];
  }

  selectAnswer(answerId: number) {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    // Permitir cambiar la respuesta
    this.selectedAnswers[currentQuestion.id!] = answerId;
    
    // Deshabilitar protección temporalmente para permitir la selección
    this.isContentProtected.set(false);
    setTimeout(() => {
      this.isContentProtected.set(true);
    }, 100);
  }

  nextQuestion(): void {
    if (!this.test) return;
    
    // Verificar que la pregunta actual esté respondida
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || !this.isQuestionAnswered(currentQuestion.id!)) {
      return; // No avanzar si no está respondida
    }
    
    // Avanzar a la siguiente pregunta sin responder
    for (let i = this.currentQuestionIndex + 1; i < this.test.questions.length; i++) {
      const question = this.test.questions[i];
      if (!this.isQuestionAnswered(question.id!)) {
        this.currentQuestionIndex = i;
        // Guardar progreso
        this.saveProgress('in_progress');
        return;
      }
    }
    
    // Si todas las siguientes están respondidas, ir a la última
    this.currentQuestionIndex = this.test.questions.length - 1;
    this.saveProgress('in_progress');
  }

  
//   previousQuestion(): void {
//     if (this.currentQuestionIndex > 0) {
//       // Permitir retroceder solo a preguntas ya respondidas
//       for (let i = this.currentQuestionIndex - 1; i >= 0; i--) {
//         const question = this.test?.questions[i];
//         if (question && this.isQuestionAnswered(question.id!)) {
//           this.currentQuestionIndex = i;
//           return;
//         }
//       }
//     }
//   }

  showSubmitConfirmation(): void {
    if (this.getAnsweredCount() !== this.test?.questions.length) {
      this.errorMessage.set('Debes responder todas las preguntas antes de finalizar el test.');
      this.showErrorModal.set(true);
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
    this.router.navigate(['/tests/list']);
  }

  getProgressPercentage(): number {
    if (!this.test) return 0;
    return (this.getAnsweredCount() / this.test.questions.length) * 100;
  }

  getUnansweredQuestionsCount(): number {
    if (!this.test) return 0;
    return this.test.questions.length - this.getAnsweredCount();
  }

  isLastQuestion(): boolean {
    if (!this.test) return false;
    return this.currentQuestionIndex === this.test.questions.length - 1;
  }

  // Métodos para prevenir copia
  preventCopy(event: Event): void {
    if (this.isContentProtected()) {
      event.preventDefault();
      return;
    }
  }

  preventContextMenu(event: MouseEvent): void {
    if (this.isContentProtected()) {
      event.preventDefault();
    }
  }

  preventSelection(event: Event): void {
    if (this.isContentProtected()) {
      event.preventDefault();
    }
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
    this.router.navigate(['/user/results']);
  }

  onErrorModalConfirm(): void {
    this.showErrorModal.set(false);
  }

  // Verificar si hay siguiente pregunta disponible
  hasNextQuestion(): boolean {
    if (!this.test) return false;
    
    // La siguiente pregunta está disponible si:
    // 1. No es la última pregunta
    // 2. La pregunta actual está respondida
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return false;
    
    if (this.currentQuestionIndex < this.test.questions.length - 1) {
      return this.isQuestionAnswered(currentQuestion.id!);
    }
    
    return false;
  }

  // Verificar si hay pregunta anterior disponible
  hasPreviousQuestion(): boolean {
    if (this.currentQuestionIndex === 0) return false;
    
    // Solo hay pregunta anterior si se ha respondido alguna pregunta anterior
    for (let i = 0; i < this.currentQuestionIndex; i++) {
      const question = this.test?.questions[i];
      if (question && this.isQuestionAnswered(question.id!)) {
        return true;
      }
    }
    
    return false;
  }

  // Ir a la primera pregunta sin responder
  goToFirstUnanswered(): void {
    const firstUnanswered = this.getFirstUnansweredQuestionIndex();
    if (firstUnanswered !== -1 && firstUnanswered !== this.currentQuestionIndex) {
      this.currentQuestionIndex = firstUnanswered;
    }
  }
}
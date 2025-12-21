import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../shared/services/test.service';
import { Test, ResumeTestResponse } from '../../../models/test.model';
import { ModalComponent } from '../../../shared/components/modal.component';

// Interfaz para el input con claves string
interface SaveResultInput {
  test_id: number;
  answers: Record<string, number>; // Cambiado a string keys
  time_taken: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

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
  selectedAnswers: Record<string, number> = {}; // Cambiado a string keys
  loading = signal(true);
  startTime = 0;
  timeElapsed = 0;
  isResuming = false;
  resultId?: number;
  
  // Señales para modales
  showConfirmSubmitModal = signal(false);
  showErrorModal = signal(false);
  showSuccessModal = signal(false);
  showConfirmExitModal = signal(false);
  
  // Datos para modales
  errorMessage = signal<string>('');
  timeTaken = signal<number>(0);
  score = signal<number>(0);
  
  // Prevención de copia (se desactiva al terminar/abandonar)
  isContentProtected = signal(true);
  
  // Para manejar navegación forzosa (abandonar test)
  isExiting = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const testId = +params['id'];
      this.loadTest(testId);
    });

    // Prevenir acciones de copia
    this.setupCopyProtection();
    
    // Prevenir navegación accidental
    this.setupNavigationProtection();
  }

  ngOnDestroy(): void {
    // Limpiar protección de navegación
    this.removeNavigationProtection();
    
    // Solo guardar si no se está saliendo intencionalmente
    if (!this.isExiting && this.isResuming && this.getAnsweredCount() > 0) {
      this.saveProgress('in_progress');
    }
  }

  setupCopyProtection(): void {
    // Prevenir selección de texto
    document.addEventListener('selectstart', this.preventSelection.bind(this));
    // Prevenir menú contextual
    document.addEventListener('contextmenu', this.preventContextMenu.bind(this));
    // Prevenir copia (Ctrl+C, Cmd+C)
    document.addEventListener('copy', this.preventCopy.bind(this));
    // Prevenir corte (Ctrl+X, Cmd+X)
    document.addEventListener('cut', this.preventCopy.bind(this));
  }

  removeCopyProtection(): void {
    // Eliminar todos los event listeners de protección
    document.removeEventListener('selectstart', this.preventSelection.bind(this));
    document.removeEventListener('contextmenu', this.preventContextMenu.bind(this));
    document.removeEventListener('copy', this.preventCopy.bind(this));
    document.removeEventListener('cut', this.preventCopy.bind(this));
  }

  setupNavigationProtection(): void {
    // Prevenir recarga de página
    window.addEventListener('beforeunload', this.preventUnload.bind(this));
    
    // Prevenir navegación con el botón atrás
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', this.preventBackNavigation.bind(this));
  }

  removeNavigationProtection(): void {
    window.removeEventListener('beforeunload', this.preventUnload.bind(this));
    window.removeEventListener('popstate', this.preventBackNavigation.bind(this));
  }

  loadTest(testId: number): void {
    this.loading.set(true);
    
    this.testService.getTestProgress(testId).subscribe({
      next: (res: ResumeTestResponse) => {
        this.test = res.test;
        this.isResuming = res.is_resuming;
        this.resultId = res.result_id;
        
        // Cargar respuestas guardadas si hay
        if (res.is_resuming && res.answers) {
          this.loadSavedAnswers(res.answers);
          this.timeElapsed = res.time_elapsed || 0;
        }
        
        // Posicionarse en la primera pregunta sin responder
        this.currentQuestionIndex = this.getFirstUnansweredQuestionIndex();
        
        // Iniciar tiempo
        this.startTime = Date.now() - (this.timeElapsed * 1000);
        
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

  loadSavedAnswers(savedAnswers: any): void {
    // Asegurar que sea un objeto con claves string
    if (typeof savedAnswers === 'object' && savedAnswers !== null) {
      if (Array.isArray(savedAnswers)) {
        // Si viene como array (backward compatibility), convertir a mapa
        this.selectedAnswers = this.arrayToMap(savedAnswers);
      } else {
        // Si ya es un objeto con claves string, usarlo directamente
        this.selectedAnswers = savedAnswers;
      }
    } else {
      this.selectedAnswers = {};
    }
  }

  // Método auxiliar para convertir array a mapa (si fuera necesario)
  private arrayToMap(answersArray: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    if (answersArray && Array.isArray(answersArray)) {
      answersArray.forEach((item: any) => {
        if (item.question_id !== undefined && item.answer_id !== undefined) {
          result[item.question_id.toString()] = item.answer_id;
        }
      });
    }
    return result;
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

  saveProgress(status: 'in_progress' | 'completed' = 'in_progress'): void {
    if (!this.test) return;

    // Ya tenemos selectedAnswers como Record<string, number>
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    
    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: this.selectedAnswers, // Directamente el mapa con claves string
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
    return this.selectedAnswers[questionId.toString()] !== undefined;
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

    // Guardar la respuesta seleccionada con key string
    this.selectedAnswers[currentQuestion.id!.toString()] = answerId;
    
    // Deshabilitar protección temporalmente para permitir la selección
    this.isContentProtected.set(false);
    setTimeout(() => {
      this.isContentProtected.set(true);
    }, 100);
  }

  // Obtener la respuesta seleccionada para una pregunta
  getSelectedAnswer(questionId: number): number | undefined {
    return this.selectedAnswers[questionId.toString()];
  }

  nextQuestion(): void {
    if (!this.test) return;
    
    // Verificar que la pregunta actual esté respondida
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || !this.isQuestionAnswered(currentQuestion.id!)) {
      this.errorMessage.set('Debes responder esta pregunta antes de avanzar.');
      this.showErrorModal.set(true);
      return;
    }
    
    // Guardar progreso al avanzar (solo aquí)
    this.saveProgress('in_progress');
    
    // Avanzar a la siguiente pregunta sin responder
    for (let i = this.currentQuestionIndex + 1; i < this.test.questions.length; i++) {
      const question = this.test.questions[i];
      if (!this.isQuestionAnswered(question.id!)) {
        this.currentQuestionIndex = i;
        return;
      }
    }
    
    // Si todas las siguientes están respondidas, ir a la última
    this.currentQuestionIndex = this.test.questions.length - 1;
  }

  // NO HAY previousQuestion() - NO se permite retroceder

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
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeTaken.set(timeSpent);

    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: this.selectedAnswers, // Mapa directamente
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
        
        // Desactivar protección de copia al terminar
        this.removeCopyProtection();
        this.removeNavigationProtection();
        this.isContentProtected.set(false);
        
        this.showSuccessModal.set(true);
      },
      error: (err: any) => {
        console.error('Error al completar test:', err);
        this.errorMessage.set(err.error?.message || 'Error al completar el test. Por favor, intenta de nuevo.');
        this.showErrorModal.set(true);
      }
    });
    
    this.showConfirmSubmitModal.set(false);
    this.isResuming = false;
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

  // Prevenir recarga/navegación accidental
  preventUnload(event: BeforeUnloadEvent): void {
    if (this.isResuming && this.getAnsweredCount() > 0 && !this.isExiting) {
      event.preventDefault();
    }
    return;
  }

  preventBackNavigation(event: PopStateEvent): void {
    if (this.isResuming && this.getAnsweredCount() > 0 && !this.isExiting) {
      history.pushState(null, '', window.location.href);
      this.showConfirmExitModal.set(true);
    }
  }

  // Métodos para abandonar el test
  showExitConfirmation(): void {
    this.showConfirmExitModal.set(true);
  }

  abandonTest(): void {
    if (!this.test) return;
    
    this.isExiting = true;
    
    // Guardar progreso con status 'in_progress' para poder retomar
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    
    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: this.selectedAnswers, // Mapa directamente
      time_taken: timeSpent,
      status: 'in_progress'
    };

    this.testService.saveOrUpdateResult(saveData).subscribe({
      next: () => {
        console.log('Test abandonado, progreso guardado');
        // Desactivar protección de copia al abandonar
        this.removeCopyProtection();
        this.removeNavigationProtection();
        this.isContentProtected.set(false);
        
        // Navegar a la página de tests en progreso
        this.router.navigate(['/tests/in-progress']);
      },
      error: (err) => {
        console.error('Error al guardar progreso al abandonar:', err);
        // Aún así navegar, pero mostrar error
        this.removeCopyProtection();
        this.removeNavigationProtection();
        this.isContentProtected.set(false);
        this.router.navigate(['/tests/in-progress']);
      }
    });
    
    this.showConfirmExitModal.set(false);
  }

  cancelExit(): void {
    this.showConfirmExitModal.set(false);
  }

  // Métodos para manejar modales
  confirmSubmit(): void {
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
}
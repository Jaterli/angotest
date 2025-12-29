import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TestService } from '../../../shared/services/test.service';
import { Test, ResumeTestResponse, QuestionWithAnswers, NextQuestionResponse, SaveResultInput } from '../../../shared/models/test.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { Observable, Subject, switchMap, takeUntil, tap, throwError } from 'rxjs';


@Component({
  selector: 'app-test-single',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './test-single.component.html'
})
export class TestSingleComponent implements OnInit, OnDestroy {
  private testService = inject(TestService);
  private sharedUtilsService = inject(SharedUtilsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  test?: Test;
  currentQuestion?: QuestionWithAnswers;
  currentQuestionNumber = 0;
  totalQuestions = 0;
  selectedAnswers: Record<string, number> = {};
  loading = signal(true);
  startTime = 0;
  timeElapsed = 0;
  isResuming = false;
  resultId?: number;
  
  // Señales para modales
  showErrorModal = signal(false);
  showSuccessModal = signal(false);
  showConfirmExitModal = signal(false);
  
  // Datos para modales
  errorMessage = signal<string>('');
  timeTaken = signal<number>(0);
  score = signal<number>(0);
  
  // Para navegación
  isCompleted = false;
  
  // Estado de carga
  savingProgress = signal(false);
  
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
    
    // Limpiar observables
    this.destroy$.next();
    this.destroy$.complete();
    
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
    console.log("loadTest id: ", testId);
    
    this.testService.getTestProgress(testId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: ResumeTestResponse) => {
          this.test = res.test;
          this.isResuming = res.is_resuming;
          this.resultId = res.result_id;
          
          // Cargar respuestas guardadas si hay
          if (res.is_resuming && res.answers) {
            this.loadSavedAnswers(res.answers);
          }
          
          this.timeElapsed = res.time_elapsed || 0;
          
          // Iniciar tiempo
          this.startTime = Date.now() - (this.timeElapsed * 1000);
          
          // Obtener la siguiente pregunta sin responder
          this.loadNextQuestion();
          
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Error al cargar el progreso del test.');
          this.showErrorModal.set(true);
        }
      });
  }

  loadNextQuestion(): void {
    if (!this.test?.id) {
      console.error('No hay test ID para cargar pregunta');
      return;
    }
       
    this.testService.getNextUnansweredQuestion(this.test.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NextQuestionResponse) => {
          
          // Verificar si ya completó todas las preguntas
          if (response.is_completed) {
            this.totalQuestions = response.total_questions || this.totalQuestions;
            this.showSuccessModal.set(true);
            return;
          }
          
          this.currentQuestion = response.question;
          this.currentQuestionNumber = response.question_number || 1;
          this.totalQuestions = response.total_questions || this.totalQuestions;
          this.isCompleted = response.is_completed || false;          
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Error al cargar la siguiente pregunta.');
          this.showErrorModal.set(true);
        }
      });
  }

  updateAnsweredCount(count: number): void {
    // Este método es para sincronizar con el backend
    // El contador real sigue siendo el de selectedAnswers
  }

  loadSavedAnswers(savedAnswers: any): void {
    // Asegurar que sea un objeto con claves string
    if (typeof savedAnswers === 'object' && savedAnswers !== null) {
      if (Array.isArray(savedAnswers)) {
        // Si viene como array, convertir a mapa
        this.selectedAnswers = this.arrayToMap(savedAnswers);
      } else {
        // Si ya es un objeto, usarlo directamente
        this.selectedAnswers = savedAnswers;
      }
    } else {
      this.selectedAnswers = {};
    }
  }

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

  saveProgress(status: 'in_progress' | 'completed' = 'in_progress'): Observable<any> {
    if (!this.test) {
      return throwError(() => new Error('No hay test disponible'));
    }

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    
    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: this.selectedAnswers,
      time_taken: timeSpent,
      status: status
    };
  
    return this.testService.saveOrUpdateResult(saveData).pipe(
      tap({
        next: (response) => {
          if (response.result && response.result.id) {
            this.resultId = response.result.id;
          }
        },
        error: (err) => {
          console.error('Error al guardar progreso:', err);
        }
      })
    );
  }

  // Métodos del template
  isQuestionAnswered(questionId: number): boolean {
    return this.selectedAnswers[questionId.toString()] !== undefined;
  }

  getAnsweredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  selectAnswer(answerId: number) {
    if (!this.currentQuestion) return;
   
    this.selectedAnswers[this.currentQuestion.id.toString()] = answerId;
    
    this.isContentProtected.set(false);
    setTimeout(() => {
      this.isContentProtected.set(true);
    }, 100);
  }

  getSelectedAnswer(questionId: number): number | undefined {
    return this.selectedAnswers[questionId.toString()];
  }

  nextQuestion(): void {
    if (!this.currentQuestion) return;
    
    // Verificar que la pregunta actual esté respondida
    if (!this.isQuestionAnswered(this.currentQuestion.id)) {
      this.errorMessage.set('Debes responder esta pregunta antes de avanzar.');
      this.showErrorModal.set(true);
      return;
    }
    
    // Deshabilitar botones mientras se guarda y carga
    this.savingProgress.set(true);
       
    // Primero guardar la respuesta actual
    this.saveProgress('in_progress')
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          console.log('Respuesta guardada, cargando siguiente pregunta...');
          // Una vez guardado, cargar siguiente pregunta
          return this.testService.getNextUnansweredQuestion(this.test!.id);
        })
      )
      .subscribe({
        next: (response: NextQuestionResponse) => {
          
          // Verificar si ya completó todas las preguntas
          if (response.is_completed) {
            this.totalQuestions = response.total_questions || this.totalQuestions;
            this.savingProgress.set(false);
            this.showSuccessModal();
            return;
          }
          
          // Actualizar pregunta actual
          this.currentQuestion = response.question;
          this.currentQuestionNumber = response.question_number;
          this.totalQuestions = response.total_questions;
          this.isCompleted = response.is_completed;
          
          this.savingProgress.set(false);
        },
        error: (err) => {
          console.error('Error al avanzar:', err);
          this.errorMessage.set('Error al guardar progreso o cargar siguiente pregunta.');
          this.showErrorModal.set(true);
          this.savingProgress.set(false);
        }
      });
  }


  submitTest(): void {
    if (!this.test) return;

    // Guardar como completado
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeTaken.set(timeSpent);

    const saveData: SaveResultInput = {
      test_id: this.test.id!,
      answers: this.selectedAnswers,
      time_taken: timeSpent,
      status: 'completed'
    };

    this.testService.saveOrUpdateResult(saveData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          
          if (response) {
            const correct = response.correct_answers || 0;
            this.score.set(response.score_percentage);
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

    this.showSuccessModal.set(false);
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
    if (!this.totalQuestions || this.totalQuestions === 0) return 0;
    return (this.getAnsweredCount() / this.totalQuestions) * 100;
  }

  getUnansweredQuestionsCount(): number {
    return this.totalQuestions - this.getAnsweredCount();
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
    this.showConfirmExitModal.set(false);    
    this.router.navigate(['/tests/in-progress']);            
  }

  formatTime(seconds: number): string{
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  cancelExit(): void {
    this.showConfirmExitModal.set(false);
  }

  // Métodos para manejar modales
  confirmSubmit(): void {
    this.submitTest();
  }

  onSuccessModalConfirm(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/tests/completed']);
  }

  onErrorModalConfirm(): void {
    this.showErrorModal.set(false);
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from '../../../core/services/test.service';
import { ResultService } from '../../../core/services/result.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Test } from '../../../models/test.model';
import { ModalComponent } from '../../../components/modal.component';

@Component({
  selector: 'app-test-resolve',
  standalone: true,
  templateUrl: './test-resolve.component.html',
  imports: [CommonModule, ModalComponent]
})
export class TestResolveComponent implements OnInit {

  test?: Test;
  selectedAnswers: Record<number, number> = {};
  loading = signal(true);
  startTime = 0;
  
  // Señales para los modales
  showCompletionModal = signal(false);
  showIncompleteModal = signal(false);
  showErrorModal = signal(false);
  showSuccessModal = signal(false);
  showConfirmSubmitModal = signal(false);
  
  // Datos para los modales
  resultData = signal<any>(null);
  errorMessage = signal<string>('');
  timeTaken = signal<number>(0);
  score = signal<number>(0);

  constructor(
    private testService: TestService,
    private resultService: ResultService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const testId = +params['id'];
      this.loadTest(testId);
    });
  }

  loadTest(testId: number): void {
    this.loading.set(true);
    
    this.testService.getTestById(testId).subscribe({
      next: (res: any) => {
        console.log('Test cargado:', res);
        this.test = res.test;
        this.startTime = Date.now();
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

  isQuestionAnswered(questionId: number): boolean {
    return this.selectedAnswers[questionId] !== undefined;
  }

  getAnsweredCount(): number {
    return Object.keys(this.selectedAnswers).length;
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

    const answers = Object.entries(this.selectedAnswers).map(([qid, aid]) => ({
      question_id: +qid,
      answer_id: +aid
    }));

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    this.timeTaken.set(timeSpent);

    this.resultService.submitResult(this.test.id!, answers, timeSpent).subscribe({
      next: (response: any) => {
        console.log('Resultado enviado:', response);
        this.resultData.set(response);
        
        // Calcular puntaje
        if (response.result) {
          const correct = response.result.correct_answers || 0;
          const total = response.result.total || this.test?.questions.length;
          this.score.set(Math.round((correct / total) * 100));
        }
        
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        console.error('Error al enviar resultado:', err);
        this.errorMessage.set(err.error?.message || 'Error al enviar el test. Por favor, intenta de nuevo.');
        this.showErrorModal.set(true);
      }
    });
    
    this.showConfirmSubmitModal.set(false);
  }


  selectAnswer(questionId: number, answerId: number) {
    this.selectedAnswers[questionId] = answerId;
  }

  // Métodos para manejar los modales
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

  onIncompleteModalConfirm(): void {
    this.showIncompleteModal.set(false);
  }

  onCompletionModalConfirm(): void {
    this.showCompletionModal.set(false);
  }

  // Calcular tiempo transcurrido
  getTimeElapsed(): string {
    if (!this.startTime) return '0:00';
    
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Ir a la lista de tests
  goToTests(): void {
    this.router.navigate(['/tests/list']);
  }

  // Reiniciar test
  restartTest(): void {
    this.selectedAnswers = {};
    this.startTime = Date.now();
    window.scrollTo(0, 0);
  }

  // Ver resultados
  viewResults(): void {
    if (this.resultData()?.result?.id) {
      this.router.navigate(['/tests/results', this.resultData().result.id]);
    } else {
      this.router.navigate(['/tests/results']);
    }
  }

  // Calcular progreso porcentual
  getProgressPercentage(): number {
    if (!this.test) return 0;
    return (this.getAnsweredCount() / this.test.questions.length) * 100;
  }

  // Obtener preguntas sin responder
  getUnansweredQuestions(): number {
    if (!this.test) return 0;
    return this.test.questions.length - this.getAnsweredCount();
  }
}
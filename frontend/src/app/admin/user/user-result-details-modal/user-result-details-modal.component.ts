import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UserResultsService } from '../../services/user-results.service';
import { UserResultDetailsModalService } from '../../services/user-result-details-modal.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';
import { UserResultDetailsResponse, UserResultsResponse } from '../../models/user-results.models';

@Component({
  selector: 'app-user-result-details-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './user-result-details-modal.component.html'
})
export class UserResultDetailsModalComponent implements OnInit, OnDestroy {
  private userResultsService = inject(UserResultsService);
  private modalService = inject(UserResultDetailsModalService);
  private sharedUtilsService = inject(SharedUtilsService);
  private subscription?: Subscription;

  // Propiedades del modal
  isOpen = false;
  userId: number | null = null;
  resultId: number | null = null;

  // Datos tipados
  resultDetails = signal<UserResultDetailsResponse | null>(null);
  selectedResult = signal<any>(null);
  
  isLoading = signal(true);
  error: string | null = null;

  ngOnInit() {
    // Suscribirse a los cambios del servicio
    this.subscription = this.modalService.modalState$.subscribe(state => {
      this.isOpen = state.isOpen;
      
      if (state.isOpen && state.userId && state.resultId) {
        this.userId = state.userId;
        this.resultId = state.resultId;
        this.selectedResult.set(null); // Resetear resultado seleccionado
        this.loadDetails(state.userId, state.resultId);
      } else {
        this.resetModal();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  closeModal(): void {
    this.modalService.close();
  }

  private resetModal(): void {
    this.resultDetails.set(null);
    this.selectedResult.set(null);
    this.isLoading.set(false);
    this.error = null;
    this.userId = null;
    this.resultId = null;
  }

  private loadDetails(userId: number, resultId: number): void {
    this.isLoading.set(true);
    this.error = null;
    this.resultDetails.set(null);

    this.userResultsService.getResultDetails(userId, resultId).subscribe({
      next: (data: UserResultDetailsResponse) => {
        this.resultDetails.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los detalles del resultado.';
        console.error('Error loading result details:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Helper methods
  formatDate(dateString: string): string {
    return this.sharedUtilsService.sharedFormatDateTime(dateString);
  }

  formatTimeTaken(seconds: number): string {
    return this.sharedUtilsService.sharedFormatTime(seconds);
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  getRoleBadgeClass(role: string): string {
    return this.sharedUtilsService.getSharedRoleBadgeClass(role);
  }

  getProgressBarEmpty(): string {
    return this.sharedUtilsService.getSharedProgressBarEmpty();
  } 

  getProgressBarColor(score: number): string {
    return this.sharedUtilsService.getSharedProgressBarColor(score);
  } 

  getStatusBadgeClass(status: string): string {
    return this.sharedUtilsService.getSharedStatusBadgeClass(status);
  }

  getStatusLabel(status: string): string {
    return this.sharedUtilsService.getSharedStatusLabel(status);
  }

  getLevelBadgeClass(level: string): string {
    return this.sharedUtilsService.getSharedLevelBadgeClass(level);
  }

  // Nuevos métodos para manejar la nueva estructura de datos
  getUserAnswerId(questionId: number): number | null {
    const result = this.resultDetails()?.result;
    if (!result || !result.answered_questions) return null;
    
    // answered_questions es un mapa {question_id: answer_id}
    const answeredQuestions = result.answered_questions as Record<number, number>;
    return answeredQuestions[questionId] || null;
  }

  getCorrectAnswerId(question: any): number | null {
    if (!question || !question.answers) return null;
    const correctAnswer = question.answers.find((a: any) => a.is_correct);
    return correctAnswer ? correctAnswer.id : null;
  }

  isQuestionCorrect(question: any): boolean {
    const userAnswerId = this.getUserAnswerId(question.id);
    const correctAnswerId = this.getCorrectAnswerId(question);
    return userAnswerId !== null && correctAnswerId !== null && userAnswerId === correctAnswerId;
  }

  getAnswerClasses(answer: any, question: any): string {
    const userAnswerId = this.getUserAnswerId(question.id);
    const correctAnswerId = this.getCorrectAnswerId(question);
    
    if (answer.id === correctAnswerId) {
      return 'answer-correct';
    }
    if (answer.id === userAnswerId && answer.id !== correctAnswerId) {
      return 'answer-incorrect';
    }
    if (answer.id === userAnswerId) {
      return 'answer-selected';
    }
    return 'answer-normal';
  }

  getAnswerTextClasses(answer: any, question: any): string {
    const userAnswerId = this.getUserAnswerId(question.id);
    const correctAnswerId = this.getCorrectAnswerId(question);
    
    if (answer.id === correctAnswerId) {
      return 'text-emerald-700 dark:text-emerald-300 font-medium';
    }
    if (answer.id === userAnswerId && answer.id !== correctAnswerId) {
      return 'text-red-700 dark:text-red-300 font-medium';
    }
    return 'text-gray-700 dark:text-gray-300';
  }

  getCorrectAnswerText(question: any): string {
    if (!question || !question.answers) return '';
    const correctAnswer = question.answers.find((a: any) => a.is_correct);
    return correctAnswer ? correctAnswer.answer_text : '';
  }

}
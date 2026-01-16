import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalComponent } from '../../../shared/components/modal.component';
import { UserResultsService } from '../../services/user-results.service';
import { UserResultDetailsModalService } from '../../services/user-result-details-modal.service';
import { SharedUtilsService } from '../../../shared/services/shared-utils.service';

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

  // Datos
  resultDetails = signal<any>(null);
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
      next: (data) => {
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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreColor(score: number): string {
    return this.sharedUtilsService.getSharedScoreColor(score);
  }

  getStatusColor(status: string): string {
    return this.sharedUtilsService.getSharedStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.sharedUtilsService.getSharedStatusLabel(status);
  }

  getAnswerClasses(answer: any, userAnswerId: number, correctAnswerId: number): string {
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

  getAnswerTextClasses(answer: any, userAnswerId: number, correctAnswerId: number): string {
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
    const correctAnswer = question.answers.find((a: any) => a.id === question.correct_answer_id);
    return correctAnswer ? correctAnswer.answer_text : '';
  }
}
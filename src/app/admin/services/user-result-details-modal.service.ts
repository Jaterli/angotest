import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserResultDetailsModalState {
  isOpen: boolean;
  userId: number | null;
  resultId: number | null;
}

@Injectable({ providedIn: 'root' })
export class UserResultDetailsModalService {
  private modalState = new BehaviorSubject<UserResultDetailsModalState>({
    isOpen: false,
    userId: null,
    resultId: null
  });

  modalState$: Observable<UserResultDetailsModalState> = 
    this.modalState.asObservable();

  open(userId: number, resultId: number): void {
    this.modalState.next({
      isOpen: true,
      userId,
      resultId
    });
  }

  close(): void {
    this.modalState.next({
      isOpen: false,
      userId: null,
      resultId: null
    });
  }

  get currentState() {
    return this.modalState.value;
  }
}
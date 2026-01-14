// services/test-stats-modal.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserStatsModalService {
  private modalState = new BehaviorSubject<{
    isOpen: boolean;
    userId: number | null;
  }>({
    isOpen: false,
    userId: null
  });

  modalState$: Observable<{ isOpen: boolean; userId: number | null }> = 
    this.modalState.asObservable();

  open(userId: number): void {
    this.modalState.next({
      isOpen: true,
      userId: userId
    });
  }

  close(): void {
    this.modalState.next({
      isOpen: false,
      userId: null
    });
  }

  get currentState() {
    return this.modalState.value;
  }
}
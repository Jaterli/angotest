// services/test-stats-modal.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TestStatsModalService {
  private modalState = new BehaviorSubject<{
    isOpen: boolean;
    testId: number | null;
  }>({
    isOpen: false,
    testId: null
  });

  modalState$: Observable<{ isOpen: boolean; testId: number | null }> = 
    this.modalState.asObservable();

  open(testId: number): void {
    this.modalState.next({
      isOpen: true,
      testId: testId
    });
  }

  close(): void {
    this.modalState.next({
      isOpen: false,
      testId: null
    });
  }

  get currentState() {
    return this.modalState.value;
  }
}
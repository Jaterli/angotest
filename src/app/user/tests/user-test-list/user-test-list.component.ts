import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test, Result, TestsResponse, ResultResponse } from '../../../models/test.model';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-test-list.component.html',
  styleUrls: ['./user-test-list.component.scss']
})

export class UserTestListComponent implements OnInit {

  results: Result[] = [];
  loading = signal(true);
  completedCount: number = 0; 
  lastResult: Result | null = null;

  constructor(private testService: TestService) {}

  // ngOnInit(): void {
  //   this.testService.getTestsForUser().subscribe({
  //     next: (res: TestsResponse) => {
  //       this.tests = res.tests;        
  //       this.loading.set(false);
  //       console.log('Tests cargados:', this.tests);
  //       console.log('Loading state:', this.loading());
  //     },
  //     error: err => {
  //       console.error(err);
  //       this.loading.set(false);
  //     }
  //   });
  // }


  ngOnInit(): void {
    this.testService.getUserTestResults().subscribe({
      next: (res: ResultResponse) => {
        this.results = res.results;        
        this.loading.set(false);
        console.log('Results cargados:', this.results);
        console.log('Loading state:', this.loading());
      },
      error: err => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
  

  // --- Métodos de conveniencia para la plantilla ---

  // completedCount(test: Test): number {
  //   return test.results?.length ?? 0;
  // }


  // lastResult(test: Test): Result | null {
  //   const count = this.completedCount(test);
  //   return count > 0 ? test.results![count - 1] : null;
  // }

  formatDateString(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    try {
      return formatDate(dateStr, 'dd/MM/yyyy', 'en-US');
    } catch {
      return dateStr;
    }
  }
}





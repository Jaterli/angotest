import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from '../../../core/services/test.service';
import { Test } from '../../../models/test.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-test-list.component.html',
  styleUrls: ['./admin-test-list.component.scss']
})
export class AdminTestListComponent implements OnInit {

  tests: Test[] = [];
  loading = signal(true);

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.testService.getAllTests().subscribe({
      next: (res: any) => {
        this.tests = res.tests;
        this.loading.set(false);
        console.log('Tests cargados:', this.tests);
        console.log('Loading state:', this.loading());
      },
      error: err => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
}

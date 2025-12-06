import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TestService } from '../../../core/services/test.service';
import { Test } from '../../../models/test.model';

@Component({
  selector: 'app-latest-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './latest-test.component.html',
  styleUrls: ['./latest-test.component.scss'],
})
export class LatestTestComponent implements OnInit {
  private testService = inject(TestService);
  private router = inject(Router);
  test = signal<Test | null>(null);
  loading = signal(true);

  ngOnInit(): void {  
    console.log('LatestTestComponent initialized');

    this.loadLatestTest();
  }

  loadLatestTest() {
    console.log('Cargando el último test disponible...');
    this.loading.set(true);
    this.testService.getLatestTest().subscribe({
      next: (t) => {
        this.test.set(t);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  goToTest() {
    if (!this.test()) return;
    console.log('Navegando al test con ID:', this.test()!.id);
    this.router.navigate(['/test', this.test()!.id]);
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-conditions.component.html'
})
export class TermsConditionsComponent {
  isLoading = signal<boolean>(false);
  currentDate = new Date();

  constructor() {
    // this.loadTerms();
  }

  loadTerms(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 800);
  }
}
// theme-toggle.component.ts
import { Component, inject } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleTheme()"
      [attr.aria-label]="'Cambiar a tema ' + (themeService.isDarkMode() ? 'claro' : 'oscuro')"
      class="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
    >
      <!-- Icono de sol (modo claro) -->
      <svg *ngIf="themeService.isDarkMode()" 
           class="w-5 h-5 transition-transform duration-300"
           fill="currentColor" 
           viewBox="0 0 20 20"
           [class.rotate-0]="!themeService.isDarkMode()"
           [class.rotate-90]="themeService.isDarkMode()">
        <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
      </svg>
      
      <!-- Icono de luna (modo oscuro) -->
      <svg *ngIf="!themeService.isDarkMode()" 
           class="w-5 h-5 transition-transform duration-300"
           fill="currentColor" 
           viewBox="0 0 20 20"
           [class.rotate-0]="themeService.isDarkMode()"
           [class.rotate-90]="!themeService.isDarkMode()">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
  `,
  styles: ``
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
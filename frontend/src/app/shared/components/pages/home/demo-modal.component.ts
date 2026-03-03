import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-demo-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
         (click)="close.emit()">
      <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
           (click)="$event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Demo de AnGoTest
          </h3>
          <button (click)="close.emit()" 
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
          <span class="text-gray-500 dark:text-gray-400">Video demo ...</span>
        </div>
        
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Descubre cómo AnGoTest puede transformar tu forma de evaluar.
        </p>
        
        <div class="flex justify-end">
          <button (click)="close.emit()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `
})
export class DemoModalComponent {
  @Output() close = new EventEmitter<void>();
}


// components/modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Fondo oscuro -->
    @if (isOpen) {
      <div class="fixed inset-0 z-[100] overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <!-- Fondo oscuro -->
          <div class="fixed inset-0 transition-opacity" aria-hidden="true">
            <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
          </div>

          <!-- Centrar modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <!-- Contenido del modal -->
          <div class="inline-block relative align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
               [class]="size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-lg'">
            
            <!-- Header -->
            <div class="px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="flex items-start">
                <!-- Icono -->
                @if (icon) {
                  <div class="flex-shrink-0">
                    <div [class]="iconClasses" class="flex items-center justify-center rounded-full">
                      @switch (icon) {
                        @case ('success') {
                          <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                        }
                        @case ('error') {
                          <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                          </svg>
                        }
                        @case ('warning') {
                          <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                          </svg>
                        }
                        @case ('info') {
                          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                          </svg>
                        }
                      }
                    </div>
                  </div>
                }
                
                <!-- Contenido -->
                <div class="ml-4 flex-1">
                  @if (title) {
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
                  }
                  <div class="mt-2">
                    @if (message && !customContent) {
                      <p class="text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
                    }
                    <ng-content></ng-content>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="button" 
                      (click)="onConfirm()"
                      [class]="primaryButtonClasses"
                      class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm">
                {{ confirmText }}
              </button>
              
              @if (showCancelButton) {
                <button type="button" 
                        (click)="onCancel()"
                        class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  {{ cancelText }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() icon: 'success' | 'error' | 'warning' | 'info' | 'navigation' | null = null; 
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() confirmText = 'Aceptar';
  @Input() cancelText = 'Cancelar';
  @Input() showCancelButton = true;
  @Input() customContent: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  get iconClasses(): string {
    const base = 'w-12 h-12';
    
    switch (this.icon) {
      case 'success':
        return `${base} bg-emerald-100 dark:bg-emerald-900/30`;
      case 'error':
        return `${base} bg-red-100 dark:bg-red-900/30`;
      case 'warning':
        return `${base} bg-yellow-100 dark:bg-yellow-900/30`;
      case 'info':
        return `${base} bg-blue-100 dark:bg-blue-900/30`;
      case 'navigation':
        return `${base} bg-purple-100 dark:bg-purple-900/30`;         
      default:
        return `${base} bg-gray-100 dark:bg-gray-700`;
    }
  }

  get primaryButtonClasses(): string {
    switch (this.icon) {
      case 'success':
        return 'bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white focus:ring-emerald-500';
      case 'error':
        return 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-600 text-white focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white focus:ring-blue-500';
      case 'navigation':
        return 'bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white focus:ring-purple-500';         
      default:
        return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white focus:ring-blue-500';
    }
  }

  onConfirm(): void {
    this.confirm.emit();
    this.close();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}
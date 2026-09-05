import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-deactivate-account-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Fondo oscuro -->
    @if (isOpen) {
      <div class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <!-- Fondo oscuro -->
          <div class="fixed inset-0 transition-opacity" aria-hidden="true">
            <div class="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
          </div>

          <!-- Centrar modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <!-- Contenido del modal -->
          <div class="inline-block relative align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
            
            <!-- Header -->
            <div class="px-6 pt-5 pb-4 sm:p-6">
               
                <!-- Contenido -->
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Eliminar cuenta permanentemente
                    </h3>
                    <div class="mt-2">
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        Esta acción es irreversible. Todos tus datos serán eliminados y tu cuenta será desactivada.
                    </p>
                    
                    <!-- Mostrar error del backend -->
                    @if (error) {
                      <div class="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div class="flex">
                          <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                          </div>
                          <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
                              Error
                            </h3>
                            <div class="mt-1 text-sm text-red-700 dark:text-red-400">
                              {{ error }}
                            </div>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Formulario de confirmación -->
                    <form [formGroup]="deactivateForm" class="mt-4 space-y-4">
                        <!-- Contraseña actual -->
                        <div>
                        <label for="currentPassword" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contraseña actual
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            formControlName="currentPassword"
                            [class]="getInputClasses('currentPassword')"
                            placeholder="Ingresa tu contraseña actual"
                            (input)="clearError()"
                        />
                        @if (deactivateForm.get('currentPassword')?.touched && deactivateForm.get('currentPassword')?.invalid) {
                            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                            La contraseña actual es requerida
                            </p>
                        }
                        </div>

                        <!-- Confirmación de texto -->
                        <div>
                        <label for="confirmText" class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Para confirmar, escribe:
                            <span class="font-bold text-red-600">CONFIRMAR ELIMINAR CUENTA</span>
                        </label>
                        <input
                            type="text"
                            id="confirmText"
                            formControlName="confirmText"
                            [class]="getInputClasses('confirmText')"
                            placeholder="Escribe exactamente: CONFIRMAR ELIMINAR CUENTA"
                            (input)="clearError()"
                        />
                        @if (deactivateForm.get('confirmText')?.touched && deactivateForm.get('confirmText')?.invalid) {
                            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                            Debes escribir exactamente: CONFIRMAR ELIMINAR CUENTA
                            </p>
                        }
                        </div>

                        <!-- Advertencias -->
                        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div class="flex">
                            <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-orange-500 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                            </div>
                            <div class="ml-3">
                            <h3 class="text-sm font-medium text-orange-800 dark:text-orange-300">
                                Advertencias importantes
                            </h3>
                            <div class="mt-2 text-sm text-orange-700 dark:text-orange-400">
                                <ul class="list-disc pl-5 space-y-1">
                                <li>No podrás recuperar tu cuenta una vez eliminada</li>
                                <li>Todos tus tests y resultados serán transferidos a un usuario contenedor</li>
                                <li>Tus datos personales serán anonimizados</li>
                                <li>Perderás acceso permanente a todos tus datos</li>
                                </ul>
                            </div>
                            </div>
                        </div>
                        </div>
                    </form>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                (click)="onSubmit()"
                [disabled]="deactivateForm.invalid || loading"
                [class]="deactivateForm.invalid || loading 
                  ? 'opacity-50 cursor-not-allowed bg-red-500 dark:bg-red-600 text-white' 
                  : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white'"
                class="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              >
                @if (loading) {
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                } @else {
                  Eliminar cuenta permanentemente
                }
              </button>
              
              <button
                type="button"
                (click)="onCancel()"
                [disabled]="loading"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class DeactivateAccountModalComponent {
  @Input() isOpen = false;
  @Input() loading = false;
  @Input() error: string | null = null;
  
  @Output() deactivate = new EventEmitter<{ current_password: string; confirm_text: string }>();
  @Output() cancel = new EventEmitter<void>();

  deactivateForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.deactivateForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      confirmText: ['', [
        Validators.required,
        Validators.pattern(/^CONFIRMAR ELIMINAR CUENTA$/)
      ]]
    });
  }

  getInputClasses(fieldName: string): string {
    const field = this.deactivateForm.get(fieldName);
    
    if (field?.touched && field?.invalid) {
      return 'w-full px-4 py-3 border-2 border-red-300 dark:border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 transition-all';
    } else {
        return 'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all';
    }

  }

  onSubmit(): void {
    if (this.deactivateForm.valid) {
      this.deactivate.emit({
        current_password: this.deactivateForm.value.currentPassword,
        confirm_text: this.deactivateForm.value.confirmText
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.deactivateForm.controls).forEach(key => {
        const control = this.deactivateForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.deactivateForm.reset();
    this.cancel.emit();
  }

  // Método para limpiar el error cuando el usuario empiece a escribir
  clearError(): void {
    if (this.error) {
      // Emitir un evento para notificar al padre que limpie el error
      // O usar un Output específico para esto
      // Por ahora, simplemente permitimos que el padre lo maneje
      // El padre debería limpiar el error cuando el usuario empiece a escribir
    }
  }
}